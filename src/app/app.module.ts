import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';

import { PersonaListComponent } from './components/persona-list/persona-list.component';
import { PersonaFormComponent } from './components/persona-form/persona-form.component';

// Apollo GraphQL Setup
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { IngresoFormComponent } from './components/ingreso-form/ingreso-form.component';
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog.component';
import { CategoriaListComponent } from './components/categoria-list/categoria-list.component';
import { CategoriaFormComponent } from './components/categoria-form/categoria-form.component';
import { PersonaSummaryDialogComponent } from './components/persona-summary-dialog/persona-summary-dialog.component';
import { SharedPaymentDialogComponent } from './components/shared-payment-dialog/shared-payment-dialog.component';
import { NgChartsModule } from 'ng2-charts';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoginComponent } from './components/login/login.component';
import { ChangePasswordDialogComponent } from './components/change-password-dialog/change-password-dialog.component';
import { IngresoListComponent } from './components/ingreso-list/ingreso-list.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AhorrosComponent } from './components/ahorros/ahorros.component';
import { ShoppingListComponent } from './components/shopping-list/shopping-list.component';
import { BudgetDialogComponent } from './components/budget-dialog/budget-dialog.component';

export function createApollo(httpLink: HttpLink) {
  return {
    link: httpLink.create({ uri: 'http://localhost:8080/graphql' }),
    cache: new InMemoryCache(),
  };
}

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ExpenseListComponent,
    ExpenseFormComponent,
    PersonaListComponent,
    PersonaFormComponent,
    IngresoListComponent,
    IngresoFormComponent,
    PaymentDialogComponent,
    CategoriaListComponent,
    CategoriaFormComponent,
    PersonaSummaryDialogComponent,
    SharedPaymentDialogComponent,
    LoginComponent,
    ChangePasswordDialogComponent,
    ConfirmDialogComponent,
    AhorrosComponent,
    ShoppingListComponent,
    BudgetDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ApolloModule,
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatTableModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    NgChartsModule,
    MatCheckboxModule,
    MatPaginatorModule
  ],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
