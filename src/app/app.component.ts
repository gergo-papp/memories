import { Component } from '@angular/core';

import { config as awsConfig, CognitoIdentityCredentials, S3 } from 'aws-sdk';
import { MatSelectionListChange } from '@angular/material/list';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private readonly s3Region = 'eu-central-1';
  private readonly s3Bucket = 'tanzania-zanzibar-2021';
  private s3: S3;

  albumNames: string[] = [];
  mediaUrls: string[] = [];

  constructor() {
    awsConfig.region = this.s3Region;
    awsConfig.credentials = new CognitoIdentityCredentials({
      IdentityPoolId: 'eu-central-1:1334a9b9-de3a-49c7-a718-5e154ee1c851',
    });

    this.s3 = new S3({
      apiVersion: '2006-03-01',
      params: { Bucket: this.s3Bucket }
    });

    this.listAlbums();
  }

  listAlbums(): void {
    this.s3.listObjectsV2({ Delimiter: '/', Bucket: this.s3Bucket }, (err, data) => {
      if (err) {
        return alert(err.message);
      }

      if (data.CommonPrefixes) {
        this.albumNames = data.CommonPrefixes.map(commonPrefix => {
          const prefix = commonPrefix.Prefix || '';
          return prefix.replace('/', '');
        });
      }
    });
  }

  viewAlbum(albumName: string): void {
    this.s3.listObjectsV2({Prefix: albumName + '/', Bucket: this.s3Bucket}, (err, data) => {
      if (err) {
        return alert(err.message);
      }

      if (data.Contents) {
        this.mediaUrls = data.Contents.map(value => {
          const valueKey = value.Key ? value.Key : '';
          return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${valueKey}`;
        });
      }
    });
  }

  onSelectionChanged(matSelectionListChange: MatSelectionListChange): void {
    if (matSelectionListChange.option.selected) {
      this.viewAlbum(matSelectionListChange.option.value);
    }
  }
}
