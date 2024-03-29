import {Component, HostListener, ViewEncapsulation, ViewChild, PLATFORM_ID, Inject, OnInit} from '@angular/core';
import {trigger, transition, animate, style, state} from '@angular/animations'
import {PerfectScrollbarComponent} from 'ngx-perfect-scrollbar';
import {isPlatformBrowser} from '@angular/common';



import {ScatterService} from '../services/scatter.services'

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    providers: [ScatterService],
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

export class HomeComponent implements OnInit {
    @ViewChild('scroll') scrollEl: PerfectScrollbarComponent;
    isBrowser: boolean;
    screenWidth: number;

    lock: boolean = false;

    boxes: any = {
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
        }
    };

    pieData: any[] = [
        {
            "name": "All Users",
            "value": 0,
            "type": 1,
        },
        {
            "name": "Current Users",
            "value": 0,
            "type": 1,
        },
    ];

    cardWidth: number = 650;


    data: any;
    currentProvider:any;
    currentIdPackage:any;


    isLoading:boolean = false;


    @HostListener('window:resize', ['$event'])
    onResize(event?) {
        this.screenWidth = window.innerWidth;
        if (this.screenWidth < 650) {
            this.cardWidth = this.screenWidth;
        }
    }

    constructor(@Inject(PLATFORM_ID) platformId: string,
                public scatterService: ScatterService) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.screenWidth = window.innerWidth;
            if (this.screenWidth < 650) {
                this.cardWidth = this.screenWidth;
            }
        }
    }

    ngOnInit() {
       /* this.scatterService.getData().then(data => {
            console.log(data);
        });*/
    }

    onScatter() {
        this.isLoading = true;
        this.scatterService.getData().then(data => {
            this.isLoading = false;

            console.log(data);

            this.data = data;

            this.setBoxVisible(2);
            setTimeout(() => {
                this.scrollToCard(1)
            }, 100);
        });


       /*
        this.scatterService.get_table_package().then(data => {

        });*/
    }

    onProvider(item:number) {
        this.currentProvider = item;

        console.log(this.currentProvider);
        this.onSelectTypePipe(1);

        this.setBoxVisible(3);
        setTimeout(() => {
            this.scrollToCard(2)
        }, 100);
    }

    onSelectTypePipe(type){
        this.pieData = [];
        if(type == 1){
            this.pieData.push(
                {
                    name: 'All Users',
                    value: this.data['users'] || 10,
                    type: 1,
                },{
                    name: 'Current Users',
                    value: this.currentProvider['users'] || 10,
                    type: 2
                }
            );

        }else if(type == 2){
            this.pieData.push(
                {
                    name: 'All staked',
                    value: this.data['staked'] || 10,
                    type: 2,
                },{
                    name: 'Current staked',
                    value: this.currentProvider['staked'] || 10,
                    type: 2
                });
        }

        console.log(this.pieData);
    }

    onNextCard(id) {
        this.setBoxVisible(id);
        setTimeout(() => {
            this.scrollToCard(id - 1)
        }, 100);
    }

    scrollToCard(number) {
        //scroll to center car position
        this.scrollEl.directiveRef.scrollToX(number * this.cardWidth, 400)
    }

    setBoxVisible(id: number) {
        this.boxes[id].visible = true;
    }

    getCountVisibleBox() {
        let count = 0;
        for (let i in this.boxes) {
            if (this.boxes.hasOwnProperty(i)) {
                if (this.boxes[i].visible) {
                    count++;
                }
            }
        }
        return count
    }

    onChooseToken() {
        //hide all card
        for (let i in this.boxes) {
            if (this.boxes.hasOwnProperty(i)) {
                this.boxes[i].visible = false;
            }
        }
        this.boxes[1].visible = true; //show card
        this.boxes[2].visible = true; //show card
    }

    onLock(val: boolean) {
        //start animation after 800ms or 0ms
        let timeOut = this.boxes[4].visible ? 0 : 800;
        setTimeout(() => {
            this.lock = val;
        }, timeOut);
    }

    setCurrentIdPackage(id){
        if(!id) return;
        this.currentIdPackage = id;
    }

    keytab(event) {
        let nextInput = event.srcElement.nextElementSibling; // get the sibling element
        let target = event.target || event.srcElement;
        let id = target.id;
        if (nextInput == null) {
            return;
        } else {
            nextInput.focus();
        }
    }


    roundNumber(number){
        if(!number) return;
        return Math.round(parseFloat(number));
    }




}
