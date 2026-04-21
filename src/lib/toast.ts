"use client";

import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  customClass: {
    popup: "!rounded-xl !shadow-lg",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const toast = {
  success: (title: string, text?: string) =>
    Toast.fire({ icon: "success", title, text }),
  error: (title: string, text?: string) =>
    Toast.fire({ icon: "error", title, text }),
  warning: (title: string, text?: string) =>
    Toast.fire({ icon: "warning", title, text }),
  info: (title: string, text?: string) =>
    Toast.fire({ icon: "info", title, text }),
};

export const modal = {
  success: (title: string, text?: string) =>
    Swal.fire({
      title,
      text,
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
    }),
  confirm: (title: string, text: string, confirmText = "Yes") =>
    Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: confirmText,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    }),
  dangerConfirm: (title: string, text: string) =>
    Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, proceed",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    }),
};
