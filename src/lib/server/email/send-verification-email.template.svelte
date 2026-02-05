<script lang="ts">
import {
  Container,
  Head,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from '@sveltelaunch/svelte-5-email'

type Props = {
  verificationCode: string
}

const { verificationCode }: Props = $props()

const fontFamily =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
const main = {
  backgroundColor: '#ffffff',
}
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
}
const paragraph = {
  fontFamily,
  fontSize: '16px',
  lineHeight: '26px',
}
const title = {
  fontFamily,
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: 'bold',
}
const code = {
  fontFamily,
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: 'bold',
  color: '#2d3748',
  backgroundColor: '#edf2f7',
  padding: '8px 16px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '8px 0',
}
const hr = {
  borderColor: '#cccccc',
  margin: '20px 0',
}
const footer = {
  fontFamily,
  color: '#8898aa',
  fontSize: '12px',
}
</script>

<Html lang="en">
  <Head />
  <Section style={main}>
    <Container style={container}>
      <Text style={paragraph}>Hi there</Text>
      <Text style={title}>Here's the verification code to continue your signup</Text>
      <Text style={paragraph}>To log into ΛΣӨП, enter this verification code when prompted:</Text>
      <Text style={code}>{verificationCode}</Text>
      <Hr style={hr} />
      <Link href="https://aeon.party" style={footer}>aeon.party</Link>
    </Container>
  </Section>
</Html>
