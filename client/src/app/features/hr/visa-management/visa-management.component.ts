import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HttpService } from 'app/shared/http.service';
import { RegistrationService } from 'app/shared/registration.service';

@Component({
  selector: 'app-visa-management',
  templateUrl: './visa-management.component.html',
  styleUrls: ['./visa-management.component.scss']
})
export class VisaManagementComponent implements OnInit {

  displayedColumns: string[] = ['name','email','status','more'];
  dataSource:any[] = [];
  displayedPendingColumns: string[] = ['email', 'name', 'status', 'more'];
  dataSourcePending:any[] = [];
  visaDetail:any = [];

  constructor(private registrationService: RegistrationService,private http:HttpService) { }

  ngOnInit(): void {
    forkJoin([this.http.getApplicationAll(),this.http.getVisaAll()]).subscribe(
      (res)=>{
        // res 1: application res 2: getVisaall
        let items = [];
        for (let i = 0; i < res[1].visa.length; i++) {
          for (let j = 0; j < res[0].app.length; j++) {
            if (res[0].app[j]._id === res[1].visa[i].application_id) {
              let item = {
                email: res[0].app[j].email,
                first: res[0].app[j].firstname,
                last: res[0].app[j].lastname,
                _id: res[1].visa[i]._id,
                status: res[1].visa[i].status,
                OPTReceiptUrl: res[1].visa[i].OPTReceiptUrl,
                OPTEADurl: res[1].visa[i].OPTEADurl,
                I983: res[1].visa[i].I983,
                I20: res[1].visa[i].I20,
                next: res[1].visa[i].next,
                workAuth: res[1].visa[i].workAuth,
                startDate: res[1].visa[i].startDate,
                endDate: res[1].visa[i].endDate,
              }
              items.push(item);
            }
          }
        }
        this.dataSource = items;
        this.dataSourcePending = this.dataSource.filter((res)=>res.status==="pending");
      }
    )
  }

  getVisaInfo(item:any) {
    this.visaDetail = item;
  }

  approve() {
    let {OPTReceiptUrl, OPTEADurl, I983, I20} = this.visaDetail;
    this.visaDetail.status = "approved";
    if (OPTReceiptUrl && OPTEADurl && I983 && I20) {
      this.visaDetail.status = "done";
    }
    console.log(this.visaDetail.next)
    if (this.visaDetail.next == "OPT Receipt") {
      this.visaDetail.next = "OPT EAD";
    } else if (this.visaDetail.next == "OPT EAD") {
      this.visaDetail.next = "I-983";
    } else if (this.visaDetail.next == "I-983") {
      this.visaDetail.next = "I-20";
    } else if (this.visaDetail.next == "I-20") {
      this.visaDetail.next = "All Documents Submitted";
    }
    console.log(this.visaDetail.next)
    for (let i = 0; i < this.dataSource.length; i++) {
      if (this.dataSource[i]._id === this.visaDetail) {
        this.dataSource[i].status = this.visaDetail.status;
        this.dataSource[i].next = this.visaDetail.next;
      }
    }
    this.dataSourcePending = this.dataSource.filter((res)=>res.status==="pending");
    this.http.editVisaApprove(this.visaDetail._id, this.visaDetail.status,
                              this.visaDetail.next).subscribe();
    window.alert("Approved");
  }

  reject() {
    this.visaDetail.status = "rejected";
    for (let i = 0; i < this.dataSource.length; i++) {
      if (this.dataSource[i]._id === this.visaDetail) {
        this.dataSource[i].status = "rejected";
      }
    }
    this.dataSourcePending = this.dataSource.filter((res)=>res.status==="pending");
    this.http.editVisaReject(this.visaDetail._id).subscribe();
    window.alert("Rejected");
  }

  sendEmailApprove() {
    this.registrationService.statusReport(this.visaDetail.email, true).subscribe();
    window.alert("Email Sent");
  }

  sendEmailReject() {
    this.registrationService.statusReport(this.visaDetail.email, false).subscribe();
    window.alert("Email Sent");
  }

}
