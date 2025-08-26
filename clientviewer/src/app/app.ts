import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [ReactiveFormsModule]
})

export class App implements OnInit {
  protected readonly title = signal('clientviewer');
  private httpClient = inject(HttpClient);
  private domSanitizer = inject(DomSanitizer);
  public fileListInput = new FormControl("", Validators.required);

  url = signal<SafeResourceUrl>("");
  contentType = signal("application/pdf");

  fileList = httpResource<FileDTO[]>(() => ({
    url: "http://localhost:5177/files/",
    method: "GET",
    mode: "cors"
  }));


  ngOnInit(): void {
    this.fileListInput.valueChanges.subscribe(this.fetchSelectedFile);
  }

  fetchSelectedFile(fileName: string | null) {
    if (fileName === null) return;

    let file = null;

    this.httpClient.get(`http://localhost:5177/files/${fileName}`, {
      mode: 'cors',
      responseType: "blob"
    }).subscribe({
      next: (value: Blob) => {
        this.contentType.set(this.getContentType(fileName));
        const objUrl = URL.createObjectURL(new Blob([value], { type: this.contentType() }));
        this.url.update(() => this.domSanitizer.bypassSecurityTrustResourceUrl(objUrl));
      }
    });
  }

  private getContentType(fileName: string): string {
    if (fileName === null || fileName === "") return "application/octet-stream";

    let contentType = "";

    const extension = fileName.split(".")[1];
    switch (extension) {
      case "pdf":
        contentType = "application/pdf";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "doc":
      case "docx":
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.documentapplication/msword";
        break;
      case "ppt":
      case "pptx":
        contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentationapplication/";
        break;
      case "xlsx":
      case "xls":
      case "csv":
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "htm":
      case "html":
        contentType = "text/html";
        break;
      default:
        contentType = "application/octet-stream";
        break;
    }

    return contentType;
  }
}

interface FileDTO {
  id: string,
  name: string
}
