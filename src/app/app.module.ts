import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component';
import {TransferHttpCacheModule} from '@nguniversal/common';
import {HttpClientModule} from '@angular/common/http';
import { DeviceDetectorModule } from 'ngx-device-detector';

//scroll
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  //suppressScrollX: false,
  //suppressScrollY: false,
  useBothWheelAxes: true
  //wheelPropagation: true
};
import { NgxChartsModule } from '@swimlane/ngx-charts';

import {MatExpansionModule} from '@angular/material/expansion';
import {MatTooltipModule} from '@angular/material/tooltip';
import { WindowRef } from './services/window.services';
import { SortByName } from './services/sortbyname';

import {AuthService} from './services/auth.services';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SortByName,
  ],
  imports: [
    BrowserModule.withServerTransition({appId: 'my-app'}),
    PerfectScrollbarModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatExpansionModule,
    MatTooltipModule,
    FormsModule,
    NgxChartsModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent, pathMatch: 'full'},
      { path: 'lazy', loadChildren: './lazy/lazy.module#LazyModule'},
      { path: 'lazy/nested', loadChildren: './lazy/lazy.module#LazyModule'}
    ]),
    DeviceDetectorModule.forRoot(),
    TransferHttpCacheModule
  ],
  exports:[
    MatExpansionModule,
    MatTooltipModule,
    SortByName
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    },
    WindowRef,
    AuthService,
    NgxChartsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
