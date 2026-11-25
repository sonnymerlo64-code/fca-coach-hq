import './globals.css';
export const metadata={
 title:'FCA Coach HQ',
 description:'FCA Baseball San Diego coaching tools',
 applicationName:'FCA Coach HQ',
 manifest:'/manifest.webmanifest',
 icons:{
  icon:[{url:'/icon.svg',type:'image/svg+xml'}],
  apple:[{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]
 },
 appleWebApp:{capable:true,title:'FCA Coach HQ',statusBarStyle:'black-translucent'}
};
export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}
