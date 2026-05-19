import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { PersonaListComponent } from './components/persona-list/persona-list.component';
import { IngresoListComponent } from './components/ingreso-list/ingreso-list.component';
import { CategoriaListComponent } from './components/categoria-list/categoria-list.component';
import { LoginComponent } from './components/login/login.component';
import { AhorrosComponent } from './components/ahorros/ahorros.component';
import { ShoppingListComponent } from './components/shopping-list/shopping-list.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'gastos', component: ExpenseListComponent, canActivate: [AuthGuard] },
  { path: 'personas', component: PersonaListComponent, canActivate: [AuthGuard] },
  { path: 'ingresos', component: IngresoListComponent, canActivate: [AuthGuard] },
  { path: 'categorias', component: CategoriaListComponent, canActivate: [AuthGuard] },
  { path: 'ahorros', component: AhorrosComponent, canActivate: [AuthGuard] },
  { path: 'compras', component: ShoppingListComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
