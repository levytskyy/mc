import {Component, ViewEncapsulation, ViewChild, PLATFORM_ID, Inject, OnInit} from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations'
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { isPlatformBrowser} from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  animations: [
    trigger(
        'enterAnimation', [
          transition(':enter', [
            style({transform: 'translateX(-100%)'}),
            animate('250ms', style({transform: 'translate3d(0, 0, 0)'}))
          ]),
          transition(':leave', [
            style({transform: 'translateX(0)', opacity: 1}),
            animate('250ms', style({transform: 'translate3d(0, 650px, 0)'}))
          ])
        ]
    )
  ]
})

export class HomeComponent implements OnInit{
  @ViewChild('scroll') scrollEl: PerfectScrollbarComponent;
  @ViewChild('panel') panelEl: any;
  isBrowser:boolean;

  boxes:any = {
    "1": {
      visible: true
    },
    "2": {
      visible: false
    },
    "3": {
      visible: false
    },
    "4": {
      visible: false
    },
    "5": {
      visible: false
    },
    "6": {
      visible: false
    },
    "7": {
      visible: false
    }
  };

  pieData: any[] = [
    {
      "name": "Unlocked",
      "value": 100
    },
    {
      "name": "Locked",
      "value": 300
    },
  ];

  visibleBoxes:number = 0;

  constructor(@Inject(PLATFORM_ID) platformId: string){
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(){
    this.setBoxVisibleCount()
  }

  onScatter(){
    this.setBoxVisible(2);
    setTimeout(()=>{
      this.scrollToCard(1)
    }, 100);
  }

  onGetToken(){
    this.setBoxVisible(3);
    setTimeout(()=>{
      this.scrollToCard(2)
    }, 100);
  }

  onNextCard(id){
    this.setBoxVisible(id);
    setTimeout(()=>{
      this.scrollToCard(id-1)
    }, 100);
  }

  scrollToCard(number){
    this.scrollEl.directiveRef.scrollToX(number * 650, 400)
  }
  
  setBoxVisible(id:number){
    this.boxes[id].visible = true;
    this.setBoxVisibleCount();
  }

  setBoxVisibleCount(){
    this.visibleBoxes = 0;
    for (let i in this.boxes){
      if (this.boxes.hasOwnProperty(i)) {
        if(this.boxes[i].visible){
          this.visibleBoxes++;
        }
      }
    }
  }


  keytab(event){
    let nextInput = event.srcElement.nextElementSibling; // get the sibling element
    let target = event.target || event.srcElement;
    let id = target.id;
    console.log(id.maxlength);

    if(nextInput == null)
      return;
    else
      nextInput.focus();
  }

}
