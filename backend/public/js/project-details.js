document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    if (
      this.textContent.includes("Connect") ||
      this.textContent.includes("Demo") ||
      this.textContent.includes("GitHub") ||
      this.textContent.includes("Share")
    ) {
      console.log("Button clicked:", this.textContent);
    }
  });
});
