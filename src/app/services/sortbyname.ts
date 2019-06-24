import { Pipe, PipeTransform, Injectable } from '@angular/core';

@Pipe({
    name: 'sortByName'
})
@Injectable()
export class SortByName implements PipeTransform {
    transform(items: any[], arr: any): any {
        if(items){
            return items.sort(function (a, b) {
                if (a.provider > b.provider) {
                    return 1;
                }
                if (a.provider < b.provider) {
                    return -1;
                }
                return 0;
            });

        }
    }
}