// utils/sendEmailCode.ts o donde prefieras centralizarlo
import sgMail from '@sendgrid/mail'

const sendgridApiKey = process.env.SENDGRID_API_KEY?.replace(/^['"]|['"]$/g, '')

if (!sendgridApiKey) {
  throw new Error('SENDGRID_API_KEY no está definido')
}

sgMail.setApiKey(sendgridApiKey)

export async function sendEmailCode(email: string, code: string) {
  const msg = {
    to: email,
    from: 'frenmymanuel@gmail.com', // Debe estar verificado en SendGrid
    subject: 'Tu código de verificación',
    text: `Tu código de verificación es: ${code}`,
    html: `<p>Hola,</p><p>Tu código de verificación es: <strong>${code}</strong></p>`,
  }

  try {
    await sgMail.send(msg)
    console.log(`📧 Código enviado a ${email}`)
  } catch (error: any) {
    console.error('❌ Error al enviar correo:', error.response?.body || error.message)
    throw new Error('No se pudo enviar el código de verificación.')
  }
}
