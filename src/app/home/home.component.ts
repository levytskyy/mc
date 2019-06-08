import {Component, HostListener, ViewEncapsulation, ViewChild, PLATFORM_ID, Inject, OnInit} from '@angular/core';
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
  isBrowser:boolean;
  screenWidth:number;

  lock:boolean = false;

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

  cardWidth:number = 650;

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
    if(this.screenWidth < 650){
      this.cardWidth = this.screenWidth;
    }
  }

  constructor(@Inject(PLATFORM_ID) platformId: string){
    this.isBrowser = isPlatformBrowser(platformId);
    if(this.isBrowser){
      this.screenWidth = window.innerWidth;
      if(this.screenWidth < 650){
        this.cardWidth = this.screenWidth;
      }
    }
  }

  ngOnInit(){

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
  }

  getCountVisibleBox(){
    let count = 0;
    for (let i in this.boxes){
      if (this.boxes.hasOwnProperty(i)) {
        if(this.boxes[i].visible){
          count++;
        }
      }
    }
    return count
  }

  onChooseToken(){
    //hide all card
    for(let i in this.boxes){
      if(this.boxes.hasOwnProperty(i)) {
        this.boxes[i].visible = false;
      }
    }
    this.boxes[1].visible = true; //show card
    this.boxes[2].visible = true; //show card
  }

  onLock(val:boolean){
    let timeOut = this.boxes[4].visible ? 0 : 800;
    setTimeout(()=>{
      this.lock = val;
    }, timeOut);
  }

  keytab(event){
    let nextInput = event.srcElement.nextElementSibling; // get the sibling element
    let target = event.target || event.srcElement;
    let id = target.id;
    if(nextInput == null){
      return;
    }else{
      nextInput.focus();
    }
  }


}
