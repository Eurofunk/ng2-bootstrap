import {Component, OnInit, Input, Self} from '@angular/core';
import {NgClass} from '@angular/common';
import {NgModel, ControlValueAccessor} from '@angular/forms';

export interface TimepickerConfig {
  hourStep:number;
  minuteStep:number;
  showMeridian:boolean;
  meridians?:any[];
  readonlyInput:boolean;
  mousewheel:boolean;
  arrowkeys:boolean;
  showSpinners:boolean;
  min?:number;
  max?:number;
}

// todo: implement global configuration via DI
// todo: refactor directive has to many functions! (extract to stateless helper)
// todo: use moment js?
// todo: implement `time` validator
// todo: replace increment/decrement blockers with getters, or extract
// todo: unify work with selected
export const timepickerConfig:TimepickerConfig = {
  hourStep: 1,
  minuteStep: 1,
  showMeridian: true,
  meridians: void 0,
  readonlyInput: false,
  mousewheel: true,
  arrowkeys: true,
  showSpinners: true,
  min: void 0,
  max: void 0
};

function isDefined(value:any):boolean {
  return typeof value !== 'undefined';
}

function def(value:any, fn:Function, defaultValue:any):any {
  return fn(value) ? value : defaultValue;
}

function addMinutes(date:any, minutes:number):Date {
  let dt = new Date(date.getTime() + minutes * 60000);
  let newDate = new Date(date);
  newDate.setHours(dt.getHours(), dt.getMinutes());
  return newDate;
}

@Component({
  /* tslint:disable */
  selector: 'timepicker[ngModel]',
  /* tslint:enable */
  directives: [NgClass],
  template: `
    <table>
      <tbody>
        <tr class="text-center" [ngClass]="{hidden: !showSpinners || readonlyInput}">
          <td><a (click)="incrementHours()" [ngClass]="{disabled: noIncrementHours()}" class="btn btn-link"><span class="glyphicon glyphicon-chevron-up"></span></a></td>
          <td>&nbsp;</td>
          <td><a (click)="incrementMinutes()" [ngClass]="{disabled: noIncrementMinutes()}" class="btn btn-link"><span class="glyphicon glyphicon-chevron-up"></span></a></td>
          <td [ngClass]="{hidden: !showMeridian}" *ngIf="showMeridian"></td>
        </tr>
        <tr>
          <td class="form-group" [ngClass]="{'has-error': invalidHours}">
            <input style="width:50px;" type="text" [(ngModel)]="hours" (change)="updateHours()" class="form-control text-center" [readonly]="readonlyInput" (blur)="hoursOnBlur($event)" maxlength="2">
          </td>
          <td>:</td>
          <td class="form-group" [ngClass]="{'has-error': invalidMinutes}">
            <input style="width:50px;" type="text" [(ngModel)]="minutes" (change)="updateMinutes()" class="form-control text-center" [readonly]="readonlyInput" (blur)="minutesOnBlur($event)" maxlength="2">
          </td>
          <td [ngClass]="{hidden: !showMeridian}" *ngIf="showMeridian"><button type="button" [ngClass]="{disabled: noToggleMeridian() || readonlyInput}" class="btn btn-default text-center" (click)="toggleMeridian()">{{meridian}}</button></td>
        </tr>
        <tr class="text-center" [ngClass]="{hidden: !showSpinners || readonlyInput}">
          <td><a (click)="decrementHours()" [ngClass]="{disabled: noDecrementHours()}" class="btn btn-link"><span class="glyphicon glyphicon-chevron-down"></span></a></td>
          <td>&nbsp;</td>
          <td><a (click)="decrementMinutes()" [ngClass]="{disabled: noDecrementMinutes()}" class="btn btn-link"><span class="glyphicon glyphicon-chevron-down"></span></a></td>
          <td [ngClass]="{hidden: !showMeridian}" *ngIf="showMeridian"></td>
        </tr>
      </tbody>
    </table>
  `
})
export class TimepickerComponent implements ControlValueAccessor, OnInit {
  public cd:NgModel;
  // config
  @Input() public hourStep:number;
  @Input() public minuteStep:number;
  @Input() public readonlyInput:boolean;
  @Input() public mousewheel:boolean;
  @Input() public arrowkeys:boolean;
  @Input() public showSpinners:boolean;
  @Input() public min:Date;
  @Input() public max:Date;
  @Input() public meridians:Array<string> = ['AM', 'PM']; // ??

  @Input()
  public get showMeridian():boolean {
    return this._showMeridian;
  }

  public set showMeridian(value:boolean) {
    this._showMeridian = value;
    // || !this.$error.time
    // if (true) {
    this.updateTemplate();
    return;
    // }
    // Evaluate from template
    /*let hours = this.getHoursFromTemplate();
     let minutes = this.getMinutesFromTemplate();
     if (isDefined(hours) && isDefined(minutes)) {
     this.selected.setHours(hours);
     this.refresh();
     }*/
  }

  public onChange:any = Function.prototype;
  public onTouched:any = Function.prototype;

  // result value
  private _selected:Date = new Date();

  private _showMeridian:boolean;
  private meridian:any; // ??

  // input values
  private hours:string;
  private minutes:string;

  private get selected():Date {
    return this._selected;
  }

  private set selected(v:Date) {
    if (v) {
      this._selected = v;
      this.updateTemplate();
      this.cd.viewToModelUpdate(this.selected);
    }
  }

  // validation
  private invalidHours:any;
  private invalidMinutes:any;

  public constructor(@Self() cd:NgModel) {
    this.cd = cd;
    cd.valueAccessor = this;
  }

  // todo: add formatter value to Date object
  public ngOnInit():void {
    // todo: take in account $locale.DATETIME_FORMATS.AMPMS;
    this.meridians = def(this.meridians, isDefined, timepickerConfig.meridians) || ['AM',
        'PM'];
    this.mousewheel = def(this.mousewheel, isDefined, timepickerConfig.mousewheel);
    if (this.mousewheel) {
      // this.setupMousewheelEvents();
    }
    this.arrowkeys = def(this.arrowkeys, isDefined, timepickerConfig.arrowkeys);
    if (this.arrowkeys) {
      // this.setupArrowkeyEvents();
    }

    this.readonlyInput = def(this.readonlyInput, isDefined, timepickerConfig.readonlyInput);

    // this.setupInputEvents();

    this.hourStep = def(this.hourStep, isDefined, timepickerConfig.hourStep);
    this.minuteStep = def(this.minuteStep, isDefined, timepickerConfig.minuteStep);
    this.min = def(this.min, isDefined, timepickerConfig.min);
    this.max = def(this.max, isDefined, timepickerConfig.max);
    // 12H / 24H mode
    this.showMeridian = def(this.showMeridian, isDefined, timepickerConfig.showMeridian);
    this.showSpinners = def(this.showSpinners, isDefined, timepickerConfig.showSpinners);
  }

  public writeValue(v:any):void {
    if (v === this.selected) {
      return;
    }
    if (v && v instanceof Date) {
      this.selected = v;
      return;
    }
    this.selected = v ? new Date(v) : void 0;
  }

  public registerOnChange(fn:(_:any) => {}):void {this.onChange = fn;}

  public registerOnTouched(fn:() => {}):void {this.onTouched = fn;}

  protected updateHours():void {
    if (this.readonlyInput) {
      return;
    }

    let hours = this.getHoursFromTemplate();
    let minutes = this.getMinutesFromTemplate();
    this.invalidHours = !isDefined(hours);
    this.invalidMinutes = !isDefined(minutes);

    if (this.invalidHours || this.invalidMinutes) {
       // TODO: needed a validation functionality.
        return;
      // todo: validation?
      // invalidate(true);
    }

    this.selected.setHours(hours);
    this.invalidHours = (this.selected < this.min || this.selected > this.max);
    if (this.invalidHours) {
      // todo: validation?
      // invalidate(true);
      return;
    } else {
      this.refresh(/*'h'*/);
    }
  }

  protected hoursOnBlur(/*event:Event*/):void {
    if (this.readonlyInput) {
      return;
    }

    // todo: binded with validation
    if (!this.invalidHours && parseInt(this.hours, 10) < 10) {
      this.hours = this.pad(this.hours);
    }
  }

  protected updateMinutes():void {
    if (this.readonlyInput) {
      return;
    }

    let minutes = this.getMinutesFromTemplate();
    let hours = this.getHoursFromTemplate();
    this.invalidMinutes = !isDefined(minutes);
    this.invalidHours = !isDefined(hours);

    if (this.invalidMinutes || this.invalidHours) {
      // TODO: needed a validation functionality.
       return;
      // todo: validation
      // invalidate(undefined, true);
    }

    this.selected.setMinutes(minutes);
    this.invalidMinutes = (this.selected < this.min || this.selected > this.max);
    if (this.invalidMinutes) {
      // todo: validation
      // invalidate(undefined, true);
      return;
    } else {
      this.refresh(/*'m'*/);
    }
  }

  protected minutesOnBlur(/*event:Event*/):void {
    if (this.readonlyInput) {
      return;
    }

    if (!this.invalidMinutes && parseInt(this.minutes, 10) < 10) {
      this.minutes = this.pad(this.minutes);
    }
  }

  protected incrementHours():void {
    if (!this.noIncrementHours()) {
      this.addMinutesToSelected(this.hourStep * 60);
    }
  }

  protected decrementHours():void {
    if (!this.noDecrementHours()) {
      this.addMinutesToSelected(-this.hourStep * 60);
    }
  }

  protected incrementMinutes():void {
    if (!this.noIncrementMinutes()) {
      this.addMinutesToSelected(this.minuteStep);
    }
  }

  protected decrementMinutes():void {
    if (!this.noDecrementMinutes()) {
      this.addMinutesToSelected(-this.minuteStep);
    }
  }

  protected toggleMeridian():void {
    if (!this.noToggleMeridian()) {
      let sign = this.selected.getHours() < 12 ? 1 : -1;
      this.addMinutesToSelected(12 * 60 * sign);
    }
  }

  private refresh(/*type?:string*/):void {
    // this.makeValid();
    this.updateTemplate();
    this.cd.viewToModelUpdate(this.selected);
  }

  private updateTemplate(/*keyboardChange?:any*/):void {
    let hours = this.selected.getHours();
    let minutes = this.selected.getMinutes();

    if (this.showMeridian) {
      // Convert 24 to 12 hour system
      hours = (hours === 0 || hours === 12) ? 12 : hours % 12;
    }

    // this.hours = keyboardChange === 'h' ? hours : this.pad(hours);
    // if (keyboardChange !== 'm') {
    //  this.minutes = this.pad(minutes);
    // }
    this.hours = this.pad(hours);
    this.minutes = this.pad(minutes);
    this.meridian = this.selected.getHours() < 12
      ? this.meridians[0]
      : this.meridians[1];
  }

  private getHoursFromTemplate():number {
    let hours = parseInt(this.hours, 10);
    let valid = this.showMeridian
      ? (hours > 0 && hours < 13)
      : (hours >= 0 && hours < 24);
    if (!valid) {
      return void 0;
    }

    if (this.showMeridian) {
      if (hours === 12) {
        hours = 0;
      }
      if (this.meridian === this.meridians[1]) {
        hours = hours + 12;
      }
    }
    return hours;
  }

  private getMinutesFromTemplate():number {
    let minutes = parseInt(this.minutes, 10);
    return (minutes >= 0 && minutes < 60) ? minutes : undefined;
  }

  private pad(value:string|number):string {
    return (isDefined(value) && value.toString().length < 2)
      ? '0' + value
      : value.toString();
  }

  private noIncrementHours():boolean {
    let incrementedSelected = addMinutes(this.selected, this.hourStep * 60);
    return incrementedSelected > this.max ||
      (incrementedSelected < this.selected && incrementedSelected < this.min);
  }

  private noDecrementHours():boolean {
    let decrementedSelected = addMinutes(this.selected, -this.hourStep * 60);
    return decrementedSelected < this.min ||
      (decrementedSelected > this.selected && decrementedSelected > this.max);
  }

  private noIncrementMinutes():boolean {
    let incrementedSelected = addMinutes(this.selected, this.minuteStep);
    return incrementedSelected > this.max ||
      (incrementedSelected < this.selected && incrementedSelected < this.min);
  }

  private noDecrementMinutes():boolean {
    let decrementedSelected = addMinutes(this.selected, -this.minuteStep);
    return decrementedSelected < this.min ||
      (decrementedSelected > this.selected && decrementedSelected > this.max);

  }

  private addMinutesToSelected(minutes:any):void {
    this.selected = addMinutes(this.selected, minutes);
    this.refresh();
  }

  private noToggleMeridian():boolean {
    if (this.readonlyInput) {
      return true;
    }

    if (this.selected.getHours() < 13) {
      return addMinutes(this.selected, 12 * 60) > this.max;
    } else {
      return addMinutes(this.selected, -12 * 60) < this.min;
    }
  }
}
