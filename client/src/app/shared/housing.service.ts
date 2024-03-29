import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ReportMessage } from './data.model';

const API_URL = "http://localhost:3000";

@Injectable({
  providedIn: 'root'
})
export class HousingService {

  constructor(private http: HttpClient) { }

  getHousingDetails(id: string): Observable<any> {
    return this.http.get(`${API_URL}/api/housing/${id}`);
  }

  getHousingSummary(): Observable<any> {
    return this.http.get(`${API_URL}/api/housing`);
  }

  createHousing(landlord: Object, address: Object, facilities: string): Observable<any> {
    return this.http.post(`${API_URL}/api/housing`, {landlord, address, facilities});
  }

  deleteHousing(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/api/housing/${id}`);
  }

  getHouseFacilityReports(id: string): Observable<any> {
    return this.http.get(`${API_URL}/api/housing/${id}/reports`);
  }

  createFacilityReport(id: string, facReport: Object): Observable<any> {
    return this.http.post(`${API_URL}/api/housing/${id}/reports`, facReport);
  }

  updateFacilityReportStatus(houseid: string, reportid: string, status: string): Observable<any> {
    return this.http.put(`${API_URL}/api/housing/${houseid}/reports/${reportid}`, {status});
  }

  getOneFacilityReport(houseid: string, reportid: string): Observable<any> {
    return this.http.get(`${API_URL}/api/housing/${houseid}/reports/${reportid}`);
  }

  addMsgToFacilityReport(houseid: string, reportid: string, msg: Object ): Observable<any> {
    return this.http.post(`${API_URL}/api/housing/${houseid}/reports/${reportid}/msg`, msg );
  }

  // may need to convert message: string into object like in addMsgToFacReport
  editMsgOnFacilityReport(houseid: string, reportid: string, messageid: string, message: string): Observable<any> {
    return this.http.put(`${API_URL}/api/housing/${houseid}/reports/${reportid}/msg/${messageid}`, {message} )
  }
}
