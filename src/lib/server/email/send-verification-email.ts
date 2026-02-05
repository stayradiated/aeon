import { render } from 'svelte/server'

import { dev as isDev } from '$app/environment'

import { getResend } from './get-resend.js'
import VerifySignupTemplate from './send-verification-email.template.svelte'

type SendVerifySignupEmailOptions = {
  userEmail: string
  verificationCode: string
}
const sendVerificationEmail = async (
  options: SendVerifySignupEmailOptions,
): Promise<void | Error> => {
  if (isDev) {
    console.info(
      `
==== EMAIL: VerifySignup ======================================================
As this is local development, we are not actually going to send an email.
${JSON.stringify(options, null, 2)}
================================================================================
`,
    )
    return
  }
  const { userEmail, verificationCode } = options
  const resend = getResend()
  const result = await resend.emails.send({
    from: 'support@aeon.party',
    to: [userEmail],
    subject: `Your AEON verification code is ${verificationCode}`,
    html: render(VerifySignupTemplate, {
      props: {
        verificationCode,
      },
    }).body,
  })
  if (result.error) {
    return result.error
  }
  return undefined
}
export { sendVerificationEmail }
