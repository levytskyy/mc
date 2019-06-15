import {Component, HostListener, ViewEncapsulation, ViewChild, PLATFORM_ID, Inject, OnInit} from '@angular/core';
import {trigger, transition, animate, style, state} from '@angular/animations'
import {PerfectScrollbarComponent} from 'ngx-perfect-scrollbar';
import {isPlatformBrowser} from '@angular/common';


import {ScatterService} from '../services/scatter.services';
import {ButtonWebViewServices} from '../scater/ButtonWebView.services';
import {AuthService} from '../services/auth.services';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    providers: [ScatterService, ButtonWebViewServices],
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


    selectedPackage = {
        provider: null,
        package: null,
        service: null
    };

    userBalances = {
        dapp: {
            availableBalance: 0,
            code: 'DAPP',
            newBalance : 0
        },
        hodl: {
            availableBalance: 0,
            code: 'HODL',
            newBalance : 0
        }
    };
    userBalanesType:string = 'dapp';

    isLoading:boolean = false;
    isSignLoading:boolean = false;
    isSelectLoading:boolean = false;
    isAuthLoading:boolean = false;

    rateLockInput:number = 0;
    stakeQut:number = 1;


    typeSign:string = 'stake';

    transactionUrl:any;

    servicesFilter:any[] = [];
    selectedFilter:string = 'all';


    @HostListener('window:resize', ['$event'])
    onResize(event?) {
        this.screenWidth = window.innerWidth;
        if (this.screenWidth < 650) {
            this.cardWidth = this.screenWidth;
        }
    }

    constructor(@Inject(PLATFORM_ID) platformId: string,
                public buttonWebViewServices: ButtonWebViewServices,
                public authService: AuthService,
                public scatterService: ScatterService) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.screenWidth = window.innerWidth;
            if (this.screenWidth < 650) {
                this.cardWidth = this.screenWidth;
            }
            this.buttonWebViewServices.init();
        }
    }

    ngOnInit() {
       /* this.scatterService.getData().then(data => {
            console.log(data);
        });*/

        this.authService.isAuth.subscribe(data => {
            this.isAuthLoading = true;
            if (data == 'authorized') {
                this.buttonWebViewServices.getData().then(data => {
                    this.isLoading = false;
                   console.log(data);
                    this.data = data;

                    //console.log(data);
                    this.servicesFilter = this.getAllServices(data);

                    this.buttonWebViewServices.getAlways().then(data => {
                        this.isAuthLoading = false;
                        this.setBoxVisible(2);
                        setTimeout(() => {
                            this.scrollToCard(1)
                        }, 100);

                        this.buttonWebViewServices.getUserBallance().then(data => {
                            //console.log('balance', data)

                            let dabpBallance = data['dapp']['rows']['length'] ? this.ballanceToInt(data['dapp']['rows'][0]['balance']) : 0;
                            let holdBallance = data['hodl']['rows']['length'] ? this.ballanceToInt(data['hodl']['rows'][0]['balance']) : 0;

                            if(dabpBallance){
                                this.userBalances['dapp']['availableBalance'] = dabpBallance;
                                this.userBalances['dapp']['newBalance'] = dabpBallance;
                            }

                            if(holdBallance){
                                this.userBalances['hold']['availableBalance'] = holdBallance;
                                this.userBalances['hold']['newBalance'] = holdBallance;
                            }
                        });

                    });

                });
            }
        });
    }

    onScatter() {
        this.isLoading = true;
        //buttonWebViewServices
        this.scatterService.getData().then(data => {
            this.isLoading = false;

            //console.log(data);

            this.data = data;

            this.setBoxVisible(2);
            setTimeout(() => {
                this.scrollToCard(1)
            }, 100);
        });
    }


    onProvider(item:number) {
        this.currentProvider = item;

        this.boxes[4]['visible'] = false;
        this.boxes[5]['visible'] = false;
        this.boxes[6]['visible'] = false;

        //console.log('currentProvider', this.currentProvider);
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
                    value: this.data['users'],
                    type: 1,
                },{
                    name: 'Current Users',
                    value: this.currentProvider['users'] ,
                    type: 2
                }
            );

        }else if(type == 2){
            this.pieData.push(
                {
                    name: 'All staked',
                    value: this.data['staked'],
                    type: 2,
                },{
                    name: 'Current staked',
                    value: this.currentProvider['staked'],
                    type: 2
                });
        }

        //console.log(this.pieData);
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
        this.transactionUrl = '';
        this.selectedPackage = {
            provider: null,
            package: null,
            service: null
        };
        //hide all card
        for (let i in this.boxes) {
            if (this.boxes.hasOwnProperty(i)) {
                this.boxes[i].visible = false;
            }
        }
        this.boxes[1].visible = true; //show card
        this.boxes[2].visible = true; //show card
    }

    onStake() {
        this.typeSign = 'stake';
        this.onNextCard(5);

        //start animation after 800ms or 0ms
        let timeOut = this.boxes[4].visible ? 0 : 800;
        setTimeout(() => {
            this.lock = false;
        }, timeOut);
    }
    onUnStake(){
        this.typeSign = 'unstake';
        this.onNextCard(5);

        //start animation after 800ms or 0ms
        let timeOut = this.boxes[4].visible ? 0 : 800;
        setTimeout(() => {
            this.lock = true;
        }, timeOut);
    }
    onSelect(){
        let _self = this;
        this.isSelectLoading = true;

        this.buttonWebViewServices.addSelectButtonEventListener(this.selectedPackage).then(
            data => {
                if(data['status'] == 'executed'){
                    _self.isSelectLoading = false;
                    //_self.onNextCard(5);
                    let timeOut = _self.boxes[4].visible ? 0 : 800;
                    setTimeout(() => {
                        _self.lock = false;
                    }, timeOut);

                    _self.transactionUrl = 'https://bloks.io/transaction/'+data['transaction']['transaction_id'];
                    console.log('transaction', _self.transactionUrl)
                }
            },
            error => {
                //console.log(error);
                this.isSelectLoading = false;
                alert(error);
            }
        );
    }

    onSignTransaction(){
        this.isSignLoading = true;
        this.boxes[6].visible = false;

        let data = {
            provider: this.selectedPackage['provider'],
            service: this.selectedPackage['service'],
            quantity: this.roundPlus(this.stakeQut) + ' ' + this.userBalances[this.userBalanesType]['code'],
        };

        let _self = this;
        if(this.typeSign == 'stake'){

            if(this.userBalanesType == 'dapp'){
                _self.lock = true;
                this.buttonWebViewServices.addStakeButtonEventListener(data).then(data => {
                        _self.onNextCard(6);
                        this.isSignLoading = false;
                        this.transactionUrl = 'https://bloks.io/transaction/'+data['transaction']['transaction_id'];
                        //console.log('transaction', this.transactionUrl);
                    },
                    error => {
                        //console.log(error);
                        alert(error);
                        this.isSignLoading = false;
                    });
            }else if(this.userBalanesType == 'hodl'){
                _self.lock = true;
                this.buttonWebViewServices.addHodlStakeButtonEventListener(data).then(data => {
                        _self.onNextCard(6);
                        this.isSignLoading = false;
                        this.transactionUrl = 'https://bloks.io/transaction/'+data['transaction']['transaction_id'];
                        //console.log('transaction', this.transactionUrl);
                    },
                    error => {
                        //console.log(error);
                        alert(error);
                        this.isSignLoading = false;
                    });
            }



        }else if(this.typeSign == 'unstake'){
            _self.lock = false;
            this.buttonWebViewServices.addUnstakeButtonEventListener(data).then(data => {
                    _self.onNextCard(6);
                    this.isSignLoading = false;

                    this.transactionUrl = 'https://bloks.io/transaction/'+data['transaction']['transaction_id'];
                    console.log('transaction', this.transactionUrl);
                },
                error => {
                    //console.log(error);
                    alert(error);
                    this.isSignLoading = false;
                });
        }
    }

    setCurrentIdPackage(serviceId, packageId){
        this.selectedPackage['provider'] = this.currentProvider['provider'];
        this.selectedPackage['package'] = packageId;
        this.selectedPackage['service'] = serviceId;
    }

    keytab(event) {
        let _self = this;
        event.preventDefault();
        //Regex that you can change for whatever you allow in the input (here any word character --> alphanumeric & underscore)
        let reg = /\w/g;
        //retreive the key pressed
        let inputChar = String.fromCharCode(event.which);
        //retreive the input's value length

        if(this.rateLockInput == null){
            this.rateLockInput = 0;
        }

        let inputLength = 0;
        if(_self.rateLockInput){
            inputLength = _self.rateLockInput.toString().length || 0;
        }


        if ( (inputLength < 4) ) {
            //if input length < 4, add the value
            this.rateLockInput = parseFloat(_self.rateLockInput + inputChar);
            if(this.rateLockInput > 100){
                this.rateLockInput = 100;
            }

            let procent = this.userBalances[this.userBalanesType]['availableBalance'] * (this.rateLockInput/100);
            this.userBalances[this.userBalanesType]['newBalance'] = this.userBalances[this.userBalanesType]['availableBalance'] - procent;
            this.stakeQut = procent;

        }else{
            //else do nothing
            return;
        }
    }


    roundNumber(number){
        if(!number) return;
        return Math.round(parseFloat(number));
    }


    ballanceToInt(balance){
        if(!balance) return 0;
        let result = balance.replace('DAPP','');
        return parseFloat(result);
    }

    setBallances(event, code):void{
        let value = event.target.value;
        this.userBalances[code]['newBalance'] = this.userBalances[code]['availableBalance'] - value;
    }

    getAllServices(data){
        if(!data) return;
        let results = [];
        let _self = this;

        for(let provider of data['providers']){
            for(let service of provider['services']){
                results.push(service['service']);
            }
        }
        let unique = results.filter( _self.onlyUnique );
        return unique;

    }

    onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    onFilterProviders(filter){
        let data = this.data;
        if(!data) return;

        this.selectedFilter = filter;

        if(filter != 'all'){
            for(let i in this.data['providers']){
                this.data['providers'][i]['hidden'] = true;
            }

            for(let i in data['providers']){
                for(let j of data['providers'][i]['services']){
                    if(j['service'] == filter){
                        this.data['providers'][i]['hidden'] = false;
                    }
                }
            }
        }else{
            for(let i in this.data['providers']){
                this.data['providers'][i]['hidden'] = false;
            }
        }
    }

    onChangeBalanceType(){
        if( this.userBalanesType == 'dapp'){
            this.userBalanesType = 'hodl';
        }else {
            this.userBalanesType = 'dapp';
        }
    }

    roundPlus(num) {
        return num.toFixed(4);
    }
    f = x => ( (x.toString().includes('.')) ? (x.toString().split('.').pop().length) : (0) );


}
