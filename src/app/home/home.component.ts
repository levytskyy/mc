import {Component, HostListener, ViewEncapsulation, ViewChild, PLATFORM_ID, Inject, OnInit} from '@angular/core';
import {trigger, transition, animate, style, state} from '@angular/animations'
import {PerfectScrollbarComponent} from 'ngx-perfect-scrollbar';
import {isPlatformBrowser, DecimalPipe, DatePipe} from '@angular/common';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import {ButtonWebViewServices} from '../scater/ButtonWebView.services';
import {AuthService} from '../services/auth.services';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    providers: [ButtonWebViewServices, DecimalPipe, DatePipe],
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

    SCROLL_VERTICAL_CONFIG: PerfectScrollbarConfigInterface = {
        suppressScrollX: true
    };

    isMobile:any = this.deviceService.isMobile() || this.deviceService.isTablet();

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
            "name": "Users",
            "value": 0,
            "type": 1,
        },
    ];
    cardWidth: number = 650;

    data: any;
    currentProvider:any;
    currentProviderTelegram:any;

    selectedPackage = {
        provider: null,
        package: null,
        service: null
    };
    userBalances = {
        dapp: {
            availableBalance: null,
            code: 'DAPP',
            newBalance : 0
        },
        hodl: {
            availableBalance: null,
            code: 'HODL',
            newBalance : 0
        }
    };
    userBalanesType:string = 'dapp';

    isLoading:boolean = false;
    isSignLoading:boolean = false;
    isSelectLoading:boolean = false;
    isChoosePackageLoading:boolean = false;
    isAuthLoading:boolean = false;
    isAuthorized:boolean = false;

    rateLockInput:number = 0;
    stakeQut:number = 0;

    typeSign:string = 'stake';

    transactionUrl:any;
    transactionSelectUrl:any;

    servicesFilter:any[] = [];
    selectedFilter:string = 'all';

    currentProviderInfo:any;

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
                private numberPipe : DecimalPipe,
                private datePipe: DatePipe,
                private deviceService: DeviceDetectorService){
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.screenWidth = window.innerWidth;
            if (this.screenWidth < 650) {
                this.cardWidth = this.screenWidth;
            }
            this.buttonWebViewServices.init();
        }

        if(this.isMobile){
            this.SCROLL_VERTICAL_CONFIG = {}
        }
    }

    updateDataAfterTransaction(){
        this.buttonWebViewServices.getAlways().then(data => {
            this.data = data;
            this.servicesFilter = this.getAllServices(data);

            this.buttonWebViewServices.getUserBallance().then(data => {
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
    }

    ngOnInit() {
        this.authService.isAuth.subscribe(data => {
            if (data == 'no-authorized') {
                this.isAuthorized = false;
            }

            if (data == 'authorized') {
                this.isAuthorized = true;
                this.isAuthLoading = true;
                    this.buttonWebViewServices.getData().then(dataTmp => {
                        this.buttonWebViewServices.getAlways().then(data => {
                            this.data = [];
                            this.isLoading = false;

                            this.data = data;

                            console.log(data);

                            this.servicesFilter = this.getAllServices(data);

                            this.isAuthLoading = false;
                            this.setBoxVisible(2);
                            setTimeout(() => {
                                this.scrollToCard(1)
                            }, 100);

                            this.buttonWebViewServices.getUserBallance().then(data => {

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
        this.buttonWebViewServices.getData().then(dataTmp => {
            this.buttonWebViewServices.getAlways().then(data => {
                this.data = [];
                this.isLoading = false;

                this.data = data;

                console.log(data);

                this.servicesFilter = this.getAllServices(data);

                this.setBoxVisible(2);
                setTimeout(() => {
                    this.scrollToCard(1)
                }, 100);
            });

        });
    }


    onProvider(item:number) {
        this.selectedPackage = {
            provider: null,
            package: null,
            service: null
        };

        this.currentProvider = item;

        this.boxes[4]['visible'] = false;
        this.boxes[5]['visible'] = false;
        this.boxes[6]['visible'] = false;

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
                    name: 'Users',
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
                    name: 'Staked',
                    value: this.currentProvider['staked'],
                    type: 2
                });
        }
    }

    onNextCard(id) {
        this.setBoxVisible(id);
        setTimeout(() => {
            this.scrollToCard(id - 1)
        }, 100);
    }

    //scroll to center card position
    scrollToCard(number) {
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

        this.setBallances(0, this.userBalanesType);
        this.stakeQut = 0;

        //start animation after 800ms or 0ms
        let timeOut = this.boxes[4].visible ? 0 : 800;
        setTimeout(() => {
            this.lock = false;
        }, timeOut);
    }
    onUnStake(){
        this.typeSign = 'unstake';
        this.onNextCard(5);

        this.setBallances(this.currentProvider['user_staked'], this.userBalanesType);
        this.stakeQut = this.currentProvider['user_staked'];

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

                    _self.transactionSelectUrl = 'https://bloks.io/transaction/'+data['transaction']['transaction_id'];
                    console.log('transaction', _self.transactionSelectUrl)
                }
            },
            error => {
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
                        this.updateDataAfterTransaction();
                    },
                    error => {
                        alert(error);
                        this.isSignLoading = false;
                    });
            }else if(this.userBalanesType == 'hodl'){
                _self.lock = true;
                this.buttonWebViewServices.addHodlStakeButtonEventListener(data).then(data => {
                        _self.onNextCard(6);
                        this.isSignLoading = false;
                        this.transactionUrl = 'https://bloks.io/transaction/'+data['transaction']['transaction_id'];
                        this.updateDataAfterTransaction();
                    },
                    error => {
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
                this.updateDataAfterTransaction();
                console.log('transaction', this.transactionUrl);
            },
            error => {
                alert(error);
                this.isSignLoading = false;
            });
        }
    }

    setCurrentIdPackage(serviceId, packageId = null){
        this.selectedPackage['provider'] = this.currentProvider['provider'];
        this.selectedPackage['package'] = packageId;
        this.selectedPackage['service'] = serviceId;
    }

    keytab(event) {
        let _self = this;
        event.preventDefault();
        let reg = /\w/g;
        let inputChar = String.fromCharCode(event.which);
        if(this.rateLockInput == null){
            this.rateLockInput = 0;
        }
        let inputLength = 0;
        if(_self.rateLockInput){
            inputLength = _self.rateLockInput.toString().length || 0;
        }
        if ( (inputLength < 4) ) {
            this.rateLockInput = parseFloat(_self.rateLockInput + inputChar);
            if(this.rateLockInput > 100){
                this.rateLockInput = 100;
            }
            let procent = this.userBalances[this.userBalanesType]['availableBalance'] * (this.rateLockInput/100);
            this.userBalances[this.userBalanesType]['newBalance'] = this.userBalances[this.userBalanesType]['availableBalance'] - procent;
            this.stakeQut = procent;

        }else{
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

    setBallances(value, code):void{
        if(!value) return;
        this.userBalances[code]['newBalance'] = this.userBalances[code]['availableBalance'] - value;

        let procent = value * 100 / (this.userBalances[this.userBalanesType]['availableBalance']);
        this.rateLockInput = Math.round(procent);
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

    onFilterMyProviders(){
        let data = this.data;
        if(!data) return;
        this.selectedFilter = 'my-providers';

        for(let i in this.data['providers']){
            this.data['providers'][i]['hidden'] = true;
        }

        for(let i in data['providers']){
            if(data['providers'][i]['user_staked']  > 0){
                this.data['providers'][i]['hidden'] = false;
            }
        }
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
        if(!num) return;
        return parseFloat(num).toFixed(4);
    }


    choosePackage(){
        this.isChoosePackageLoading = true;
        this.buttonWebViewServices.getMore(this.currentProvider['provider']).then(data => {
            this.isChoosePackageLoading = false;

            this.currentProviderInfo = data;
            this.onNextCard(4);

            if(data && data['dsp_json_uri']){
                this.buttonWebViewServices.getTelegram(data['dsp_json_uri']).then(data2 => {
                    this.currentProviderTelegram = data2['social']['telegram'];
                });
            }
        });
    }


    getPackageInfo(data): any {
        let info;

        let user_expire = this.datePipe.transform(data['user_expire'], 'MM.dd.yyyy');
        if(data['user_expire'] != 0){
            info = 'Users expire: '+ user_expire;
        }

        function transformQuota(data){
            let result = '';
            if(data['quota_left'] != 0){
                result = data['quota_left'].split(' QUOTA')[0]  + '/' + data['quota'].split(' QUOTA')[0];
            }else{
                result = data['quota'];
            }
            return result;
        }

        return 'Staked: '+ this.roundPlus(data['staked']) +'' +
            '\n Min stake quantity: '+ this.roundPlus(data['min_stake_quantity']) +'' +
            '\n Users: '+ data['users'] +'' +
            '\n Users staked: '+ data['user_staked'] +'' +
            '\n Quota: '+ transformQuota(data) +'' +
            '\n' + (info ? info : '');
    }

}
