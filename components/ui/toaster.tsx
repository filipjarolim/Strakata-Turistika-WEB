"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast } from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast
            key={id}
            title={title}
            description={description}
            action={action}
            {...props}
          />
        )
      })}
    </>
  )
}
