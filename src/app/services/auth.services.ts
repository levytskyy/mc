import {EventEmitter, Output} from '@angular/core';

export class AuthService {
    @Output() isAuth:EventEmitter<any> = new EventEmitter();
    @Output() userBalances:EventEmitter<any> = new EventEmitter();

    public onAuth(val:string){
        this.isAuth.emit(val);
    }

    public emitUserBalances(data){
        this.userBalances.emit(data);
    }

}