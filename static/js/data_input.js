function updateUnit() {
  const sourceType = document.getElementById("source_type").value;
  const unitSelect = document.getElementById("unit");

  unitSelect.value = "";

  const unitOptions = {
    electricity: "kWh",
    bus_diesel: "Liters",
    canteen_lpg: "kg",
    waste_landfill: "kg",
  };

  if (sourceType && unitOptions[sourceType]) {
    unitSelect.value = unitOptions[sourceType];
  }
}

document.getElementById("dataForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const formData = {
    date: document.getElementById("date").value,
    source_type: document.getElementById("source_type").value,
    raw_value: parseFloat(document.getElementById("raw_value").value),
    unit: document.getElementById("unit").value,
  };

  fetch("/api/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      const messageContainer = document.getElementById("messageContainer");

      if (data.message) {
        messageContainer.innerHTML = `
                <div class="success-message">
                    ${data.message}
                </div>
            `;
        document.getElementById("dataForm").reset();
      } else if (data.error) {
        messageContainer.innerHTML = `
                <div class="error-message">
                    ${data.error}
                </div>
            `;
      }

      setTimeout(() => {
        messageContainer.innerHTML = "";
      }, 3000);
    })
    .catch((error) => {
      console.error("Error:", error);
      const messageContainer = document.getElementById("messageContainer");
      messageContainer.innerHTML = `
            <div class="error-message">
                An error occurred while submitting data
            </div>
        `;
    });
});

document.getElementById("date").valueAsDate = new Date();

// Human Count Form handling
const humanCountForm = document.getElementById("humanCountForm");
if (humanCountForm) {
  humanCountForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = {
      date: document.getElementById("humanDate").value,
      humans: parseInt(document.getElementById("humans").value, 10),
    };

    fetch("/api/humans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        const messageContainer = document.getElementById("humanMessageContainer");

        if (data.message) {
          messageContainer.innerHTML = `
            <div class="success-message">
              ${data.message}
            </div>
          `;
          humanCountForm.reset();
          // Reset date to today
          const humanDateInput = document.getElementById("humanDate");
          if (humanDateInput) {
            humanDateInput.valueAsDate = new Date();
          }
        } else if (data.error) {
          messageContainer.innerHTML = `
            <div class="error-message">
              ${data.error}
            </div>
          `;
        }

        setTimeout(() => {
          messageContainer.innerHTML = "";
        }, 3000);
      })
      .catch((error) => {
        console.error("Error:", error);
        const messageContainer = document.getElementById("humanMessageContainer");
        messageContainer.innerHTML = `
          <div class="error-message">
            An error occurred while submitting human count data
          </div>
        `;
      });
  });

  // Set default date to today
  const humanDateInput = document.getElementById("humanDate");
  if (humanDateInput) {
    humanDateInput.valueAsDate = new Date();
  }
}

// CSV Upload handling
const csvInput = document.getElementById("csvFileInput");
if (csvInput) {
  csvInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    const messageContainer = document.getElementById("csvMessageContainer");
    messageContainer.innerHTML = "";

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const text = evt.target.result;
      // Basic CSV parse: split lines and commas
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length < 2) {
        messageContainer.innerHTML = `<div class="error-message">Invalid CSV format.</div>`;
        return;
      }

      const header = lines[0].trim();
      const expectedHeader = "date,source_type,raw_value,unit";
      if (header.toLowerCase() !== expectedHeader) {
        messageContainer.innerHTML = `<div class="error-message">Invalid CSV format.</div>`;
        return;
      }

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.length !== 4) {
          messageContainer.innerHTML = `<div class="error-message">Invalid CSV format.</div>`;
          return;
        }
        const [date, source_type, raw_value, unit] = cols;
        // Basic validation
        if (!date || !source_type || !raw_value || !unit) {
          messageContainer.innerHTML = `<div class="error-message">Invalid CSV format.</div>`;
          return;
        }
        const parsedValue = parseFloat(raw_value.replace(/"/g, ""));
        if (isNaN(parsedValue)) {
          messageContainer.innerHTML = `<div class="error-message">Invalid CSV format.</div>`;
          return;
        }

        records.push({ date, source_type, raw_value: parsedValue, unit });
      }

      // Send to server
      fetch("/api/upload_csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })
        .then((res) => res.json())
        .then((resp) => {
          if (resp.success) {
            messageContainer.innerHTML = `<div class="success-message">${
              resp.message || "CSV uploaded successfully."
            }</div>`;
            csvInput.value = "";
          } else {
            messageContainer.innerHTML = `<div class="error-message">${
              resp.error || "Invalid CSV format."
            }</div>`;
          }

          setTimeout(() => {
            messageContainer.innerHTML = "";
          }, 5000);
        })
        .catch((err) => {
          console.error(err);
          messageContainer.innerHTML = `<div class="error-message">An error occurred while uploading CSV.</div>`;
        });
    };

    reader.readAsText(file);
  });
}
