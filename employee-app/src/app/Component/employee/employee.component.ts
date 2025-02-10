import { Component, ElementRef, inject, OnInit, ViewChild, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from '../../Models/employee';
import { EmployeeService } from '../../Services/employee.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit {
  @ViewChild('myModel') model : ElementRef | undefined;

  employeeList : Employee[] = [];
  empService = inject(EmployeeService);
  employeeForm: FormGroup = new FormGroup({});

  constructor(private fb: FormBuilder){}

  ngOnInit(): void {
      this.setFormState();
      this.getEmployees();
  }

  openModel(){
    const  empModel = document.getElementById('myModal')
    if(empModel != null){
      empModel.style.display = 'block';
    }
  }
  closeModel(){
    this.setFormState();
    if(this.model != null){
      this.model.nativeElement.style.display = 'none';
    }
  }

  getEmployees()
  {
    this.empService.getAllEmployees().subscribe((res)=> {
        this.employeeList = res;
    })
  }
  setFormState()
  {
    this.employeeForm = this.fb.group({
      id:[0],
      name:['',[Validators.required]],
      email:['',[Validators.required]],
      mobile:['',[Validators.required]],
      age:['',[Validators.required]],
      salary:['',[Validators.required]],
      status:[false,[Validators.required]],

    });
  }
  formValues : any
  onSubmit()
  {
    console.log(this.employeeForm.value);

    if(this.employeeForm.invalid)
    {
      alert('Please Fill All Fields');
      return
    }

    if(this.employeeForm.value.id == 0)
    {
      this.formValues = this.employeeForm.value;
      this.empService.addEmployee(this.formValues).subscribe((res)=>{
        alert('Employee Added Successfully');
        this.getEmployees();
        this.employeeForm.reset();
        this.closeModel();
      });
    }
    else
    {
      this.formValues = this.employeeForm.value;
      this.empService.updateEmployee(this.formValues).subscribe((res)=>{
        alert('Employee updated Successfully');
        this.getEmployees();
        this.employeeForm.reset();
        this.closeModel();
      });
    }
    
  }

  onDelete(id:number)
  {
    const isConfirm = confirm("Are you sure you want to delete this Employee ")
    if(isConfirm)
    {
      this.empService.deleteEmployee(id).subscribe((res)=>{
        alert('Employee Deleted Successfully');
        this.getEmployees();
      });
    }   
   
  }

  onEdit(Employee: Employee)
  {
    this.openModel();
    this.employeeForm.patchValue(Employee);

  }

}
