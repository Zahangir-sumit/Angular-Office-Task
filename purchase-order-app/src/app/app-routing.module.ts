import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/purchase-orders', pathMatch: 'full' },
  { 
    path: 'purchase-orders', 
    loadChildren: () => import('./purchase-order/purchase-order.module').then(m => m.PurchaseOrderModule) 
  },
  { path: '**', redirectTo: '/purchase-orders' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }