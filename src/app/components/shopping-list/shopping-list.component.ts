import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ShoppingService, Compra } from 'src/app/services/shopping/shopping.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  shoppingList$!: Observable<Compra[]>;
  pendingItems$!: Observable<Compra[]>;
  boughtItems$!: Observable<Compra[]>;
  
  private destroy$ = new Subject<void>();
  
  form: FormGroup;
  isAdding = false;

  constructor(
    private shoppingService: ShoppingService,
    private notify: NotificationService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      precio: [null],
      lugar: ['']
    });
  }

  ngOnInit(): void {
    this.loadList();
  }

  loadList() {
    this.shoppingList$ = this.shoppingService.getShoppingList();
    
    this.pendingItems$ = this.shoppingList$.pipe(
      map(items => items.filter(i => !i.comprado))
    );
    
    this.boughtItems$ = this.shoppingList$.pipe(
      map(items => items.filter(i => i.comprado))
    );
  }

  toggleAdd() {
    this.isAdding = !this.isAdding;
    if (!this.isAdding) {
      this.form.reset();
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const { nombre, precio, lugar } = this.form.value;
    this.shoppingService.createShoppingItem(nombre, precio, lugar)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notify.success('Artículo agregado a la lista');
          this.form.reset();
          this.isAdding = false;
        },
        error: (err) => {
          console.error(err);
          this.notify.error('Error al agregar el artículo');
        }
      });
  }

  toggleStatus(item: Compra) {
    this.shoppingService.toggleShoppingItem(item.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Si lo tenemos en refetch o actualizamos localmente
          // GraphQL service uses refetchQueries = ['GetShoppingList'] by default 
          // or we can just reload for simplicity. I'll loadList again or rely on the observable.
          // In shoppingService, toggle doesn't have refetchQueries. I'll just reload the list.
          this.loadList();
          this.notify.success(`Artículo marcado como ${item.comprado ? 'pendiente' : 'comprado'}`);
        },
        error: (err) => {
          console.error(err);
          this.notify.error('Error al actualizar el estado');
        }
      });
  }

  deleteItem(item: Compra, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Artículo',
        message: `¿Estás seguro de que quieres eliminar "${item.nombre}" de tu lista?`
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.shoppingService.deleteShoppingItem(item.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notify.success('Artículo eliminado');
            },
            error: (err) => {
              console.error(err);
              this.notify.error('Error al eliminar');
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
