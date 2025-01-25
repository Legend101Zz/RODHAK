function myFunction() {
  var x = document.getElementById("myInput");
  if (x.type === "password") {
    x.type = "text";
  } else {
    x.type = "password";
  }
}

// Add file input preview handlers
document.getElementById("file").addEventListener("change", function (e) {
  const fileList = document.getElementById("selectedFiles");
  fileList.innerHTML = "";
  for (let i = 0; i < this.files.length; i++) {
    fileList.innerHTML += `<div class="selected-file mt-2">
            <i class="fas fa-file-alt"></i> ${this.files[i].name}
        </div>`;
  }
});

document.getElementById("file2").addEventListener("change", function (e) {
  const fileList = document.getElementById("selectedFiles2");
  fileList.innerHTML = "";
  for (let i = 0; i < this.files.length; i++) {
    fileList.innerHTML += `<div class="selected-file mt-2">
            <i class="fas fa-file-alt"></i> ${this.files[i].name}
        </div>`;
  }
});
