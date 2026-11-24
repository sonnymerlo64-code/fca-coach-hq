import {PDFDocument, StandardFonts, rgb} from 'pdf-lib';

// Black-and-white, letter-size PDF. All text comes from a coach-reviewed report.
function printable(value) {
  return String(value || '').replace(/\r/g, '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\u2022/g, '-').replace(/[^\x20-\x7E\n]/g, ' ');
}
export async function buildEvaluationPdf({playerName, team, report, evaluatedAt}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 612, pageHeight = 792, margin = 48, textWidth = pageWidth - margin * 2;
  let page, y, pageNum = 0;
  const ink=rgb(0.07,0.07,0.07);
  function nextPage() {
    page=doc.addPage([pageWidth,pageHeight]);pageNum++;y=pageHeight-52;
    page.drawText('FCA BASEBALL SAN DIEGO',{x:margin,y,size:15,font:bold,color:ink});
    y-=15;
    page.drawLine({start:{x:margin,y},end:{x:pageWidth-margin,y},thickness:1,color:ink});
    y-=31;
  }
  function ensure(height) {if(y-height<55)nextPage();}
  function linesFor(text, face, size) {
    const words=text.split(/\s+/).filter(Boolean), out=[];let line='';
    for(const word of words) {
      const candidate=line?line+' '+word:word;
      if(face.widthOfTextAtSize(candidate,size)<=textWidth)line=candidate;
      else {if(line)out.push(line);line=word;
        // Split exceptionally long tokens to avoid horizontal overflow.
        while(line.length>1&&face.widthOfTextAtSize(line,size)>textWidth){
          let take=1;
          while(take<line.length&&face.widthOfTextAtSize(line.slice(0,take+1),size)<=textWidth)take++;
          out.push(line.slice(0,take));line=line.slice(take);
        }
      }
    }
    if(line)out.push(line);
    return out;
  }
  nextPage();
  ensure(65);
  page.drawText('PLAYER DEVELOPMENT EVALUATION',{x:margin,y,size:13,font:bold,color:ink});y-=25;
  for(const line of ['Player: '+printable(playerName),'Team: '+printable(team),'Date: '+printable(evaluatedAt||new Date().toISOString().slice(0,10))]) {
    ensure(17);page.drawText(line,{x:margin,y,size:10,font,color:ink});y-=17;
  }
  y-=15;
  const sections=printable(report).split('\n');
  for(const raw of sections) {
    const t=raw.trim();
    if(!t){y-=8;continue}
    const heading=/^(offense|defense|character|accolades|strengths|areas for improvement|improvement plan|individual improvement plan|two-week improvement plan|recommended drills|coach comments|summary|development priorities)\s*:?$/i.test(t)||(/^\*\*[^*]+\*\*$/.test(t));
    const line=t.replace(/^\*\*(.*)\*\*$/, '$1').replace(/^#{1,4}\s*/,'');
    const face=heading?bold:font, size=heading?11:10, leading=heading?17:15;
    const chunks=linesFor(line,face,size);
    ensure(Math.min(chunks.length*leading+5,60));
    for(const chunk of chunks){ensure(leading);page.drawText(chunk,{x:margin,y,size,font:face,color:ink});y-=leading}
    if(heading)y-=5;
  }
  const pages=doc.getPages();
  for(let i=0;i<pages.length;i++){
    const p=pages[i];
    p.drawLine({start:{x:margin,y:40},end:{x:pageWidth-margin,y:40},thickness:0.5,color:ink});
    p.drawText('FCA Baseball San Diego  |  Player Development  |  Page '+(i+1)+' of '+pages.length,
      {x:margin,y:25,size:8,font,color:ink});
  }
  return Buffer.from(await doc.save());
}
