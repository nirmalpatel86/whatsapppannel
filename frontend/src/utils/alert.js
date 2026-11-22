import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export const alert = {
  success: (text) => Toast.fire({ icon: 'success', title: text }),
  error: (text) => Toast.fire({ icon: 'error', title: text }),
  warning: (text) => Toast.fire({ icon: 'warning', title: text }),
  info: (text) => Toast.fire({ icon: 'info', title: text }),
  confirm: (title, text) => Swal.fire({
    title, text, icon: 'warning',
    showCancelButton: true, confirmButtonColor: '#e8b931',
    cancelButtonColor: '#6b7280', confirmButtonText: 'Yes',
  }),
  fire: (opts) => Swal.fire(opts),
};

export default alert;
