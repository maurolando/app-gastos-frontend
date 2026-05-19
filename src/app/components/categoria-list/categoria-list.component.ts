import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Categoria, ExpenseService } from 'src/app/services/expense/expense.service';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';
import { NotificationService } from 'src/app/services/notification/notification.service';

@Component({
  selector: 'app-categoria-list',
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.scss']
})
export class CategoriaListComponent implements OnInit {
  categorias$!: Observable<Categoria[]>;
  selectedCategoria: Categoria | null = null;

  constructor(
    private expenseService: ExpenseService, 
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.categorias$ = this.expenseService.getCategorias();
  }

  selectCategoria(cat: Categoria) {
    this.selectedCategoria = (this.selectedCategoria?.id === cat.id) ? null : cat;
  }

  refresh() {
    this.categorias$ = this.expenseService.getCategorias();
  }

  openForm() {
    const dialogRef = this.dialog.open(CategoriaFormComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.createCategoria(result).subscribe(() => {
          this.selectedCategoria = null;
          this.refresh();
          this.notify.success('Categoría creada con éxito');
        });
      }
    });
  }

  editCat(cat: Categoria, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '400px',
      data: cat
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.updateCategoria(cat.id, result).subscribe(() => {
          this.selectedCategoria = null;
          this.refresh();
          this.notify.success('Categoría actualizada');
        });
      }
    });
  }

  deleteCat(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      this.expenseService.deleteCategoria(id).subscribe({
        next: (success) => {
          if (success) {
            this.selectedCategoria = null;
            this.refresh();
            this.notify.success('Categoría eliminada');
          } else {
            this.notify.error('No se pudo eliminar: la categoría podría estar en uso.');
          }
        },
        error: (err) => {
          this.notify.error('Error al eliminar: existen registros asociados.');
        }
      });
    }
  }
}
