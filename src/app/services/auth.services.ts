import {EventEmitter, Output} from '@angular/core';

export class AuthService {
    @Output() isAuth:EventEmitter<any> = new EventEmitter();

    public onAuth(val:string){
        this.isAuth.emit(val);
    }

}