import { HttpClient, httpResource } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as officeParser from '../officeParserBundle@5.2.0.js';

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

  url = signal<SafeResourceUrl | null>(this.domSanitizer.bypassSecurityTrustResourceUrl(""));
  objUrl = signal("");
  contentType = signal("application/pdf");
  officeText = signal("");

  fileList = httpResource<FileDTO[]>(() => ({
    url: "http://localhost:5177/files/",
    method: "GET",
    mode: "cors"
  }));


  ngOnInit(): void {
  }

  fetchSelectedFile({ target }: Event) {
    const fileName = (<HTMLOptionElement>target).value;
    console.log(fileName);
    if (fileName === null || fileName === "") {
      URL.revokeObjectURL(this.objUrl());
      this.url.set(this.domSanitizer.bypassSecurityTrustResourceUrl(""));
      this.contentType.set("")
      return;
    }

    if (this.url() !== null) URL.revokeObjectURL(this.objUrl());


    console.log(this.url(), this.objUrl());

    this.httpClient.get(encodeURI(`http://localhost:5177/files/${fileName}`), {
      mode: 'cors',
      responseType: 'blob'
    }).subscribe({
      next: async (value: Blob) => {
        this.contentType.set(this.getContentType(fileName));

        if (this.contentType().includes("officedocument")) {
          const parsedDoc = await this.parseOfficeFile(value);
          this.officeText.set(parsedDoc);
          return;
        }

        this.objUrl.set(URL.createObjectURL(new Blob([value], { type: this.contentType() })));
        this.url.set(this.domSanitizer.bypassSecurityTrustResourceUrl(this.objUrl()));
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
      case "eml":
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

  private async parseOfficeFile(file: Blob) {
    const parsedDoc = await officeParser.parseOfficeAsync(await file.arrayBuffer(), {
      outputErrorToConsole: true,
    });

    console.log(parsedDoc);

    return parsedDoc;
  }
}

interface FileDTO {
  id: string,
  name: string
}
