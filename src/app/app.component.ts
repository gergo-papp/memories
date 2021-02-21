import { Component, HostListener, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';

import { config as awsConfig, CognitoIdentityCredentials, S3 } from 'aws-sdk';
import { MatSelectionListChange } from '@angular/material/list';
import { MatDrawerContent } from '@angular/material/sidenav';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  private readonly s3Region = 'eu-central-1';
  private readonly s3Bucket = 'tanzania-zanzibar-2021';
  private s3: S3;

  albumNames: string[] = [];
  imageUrls: string[] = [];
  imageUrlsToLoad: string[] = [];
  imagesToLoad = 5;
  videoUrls: string[] = [];
  videoIndex = 0;
  albumsOpened = false;

  @ViewChild(MatDrawerContent)
  matDrawerContent!: MatDrawerContent;

  ngAfterViewInit(): void {
    this.matDrawerContent.elementScrolled().subscribe(this.onScroll.bind(this));
  }

  onScroll(): void {
    if (this.bottomReached()) {
      this.imagesToLoad++;
      this.imageUrlsToLoad = this.imageUrls.slice(0, this.imagesToLoad);
      this.changeDetectorRef.detectChanges();
    }
  }

  constructor(private changeDetectorRef: ChangeDetectorRef) {
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

  private bottomReached(): boolean {
    return this.matDrawerContent.measureScrollOffset('bottom') < 100;
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
        this.albumsOpened = true;
      }
    });
  }

  viewAlbum(albumName: string): void {
    this.s3.listObjectsV2({Prefix: albumName + '/', Bucket: this.s3Bucket, RequestPayer: 'requester' }, (err, data) => {
      if (err) {
        return alert(err.message);
      }

      if (data.Contents) {
        this.imageUrls = data.Contents.filter(value => {
          // images and videos will have a file type
          return value.Key && (value.Key.includes('JPG') || value.Key.includes('PNG'));
        })
        .map(value => {
          return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${value.Key}`;
        });
        this.imageUrlsToLoad = this.imageUrls.slice(0, 5);
        this.imagesToLoad = 5;

        this.videoUrls = data.Contents.filter(value => {
          // images and videos will have a file type
          return value.Key && (value.Key.includes('MP4'));
        })
        .map(value => {
          return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${value.Key}`;
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
