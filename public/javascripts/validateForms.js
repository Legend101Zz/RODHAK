(function () {
  "use strict";

  const forms = document.querySelectorAll(".validated-form");
  const loadingOverlay = document.getElementById("loadingOverlay");

  Array.from(forms).forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          // Show loading overlay only if form is valid
          showLoading(form);
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });

  function showLoading(form) {
    // Show loading overlay
    loadingOverlay.style.display = "flex";

    // Disable form
    form.classList.add("form-disabled");

    // Update loading text after delays to show progress
    setTimeout(() => {
      document.querySelector(".loading-text").textContent =
        "Uploading documents...";
    }, 2000);

    setTimeout(() => {
      document.querySelector(".loading-text").textContent = "Almost there...";
    }, 4000);

    // Add form submission handler
    form.addEventListener("submit", function () {
      // Hide loading overlay on page unload (when form redirects)
      window.addEventListener("unload", function () {
        loadingOverlay.style.display = "none";
        form.classList.remove("form-disabled");
      });
    });
  }
})();
