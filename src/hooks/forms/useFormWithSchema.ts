import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCallback } from 'react'

export function useFormWithSchema(schema, defaultValues = {}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur'
  })

  const validate = useCallback(async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      const errors = form.formState.errors
      const firstError = Object.values(errors)[0]
      if (firstError) {
        return { success: false, error: firstError.message }
      }
    }
    return { success: true }
  }, [form])

  const getData = useCallback(() => {
    try {
      const parsed = schema.parse(form.getValues())
      return parsed
    } catch (e) {
      if (e instanceof z.ZodError) {
        return { success: false, error: e.errors[0].message }
      }
      return { success: false, error: 'Erro ao validar dados' }
    }
  }, [form, schema])

  return {
    ...form,
    validate,
    getData
  }
}

export { z }