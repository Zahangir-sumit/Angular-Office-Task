import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Ngx-Bootstrap modules
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { PurchaseOrderListComponent } from './pages/purchase-order-list/purchase-order-list.component';
import { PurchaseOrderFormComponent } from './pages/purchase-order-form/purchase-order-form.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const routes: Routes = [
  { path: '', component: PurchaseOrderListComponent },
  { path: 'create', component: PurchaseOrderFormComponent },
  { path: 'edit/:id', component: PurchaseOrderFormComponent },
  { path: 'view/:id', component: PurchaseOrderFormComponent }
];

@NgModule({
  declarations: [
    PurchaseOrderListComponent,
    PurchaseOrderFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // ← This is REQUIRED for ngModel in pagination
    RouterModule.forChild(routes),
    BsDatepickerModule.forRoot(),
    PaginationModule.forRoot() // ← Use forRoot() here
  ]
})
export class PurchaseOrderModule { }
