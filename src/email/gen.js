// builds the email HTML; node gen.js [base] -> writes email.html
const base = process.argv[2] || "https://countahead.ai/";
const F = "font-family:Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif";
const step = (n, when, title, body, on, last) => `<tr>
<td width="52" valign="top" style="padding:0"><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td width="36" height="36" align="center" valign="middle" bgcolor="${on ? "#FFD15C" : "#FFFFFF"}" style="background:${on ? "#FFD15C" : "#FFFFFF"};border:2px solid #0B1B3A;${F};font-size:13px;font-weight:800;color:#0B1B3A">${n}</td></tr>${last ? "" : `<tr><td align="center" style="padding:0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="2" height="34" bgcolor="#0B1B3A" style="background:#0B1B3A;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>`}</table></td>
<td valign="top" style="padding:0 0 ${last ? 0 : 14}px;${F}"><div style="font-size:12px;line-height:1.3;font-weight:800;letter-spacing:.12em;color:${on ? "#8A5A00" : "#2450DC"}">${when}</div><div style="font-size:19px;line-height:1.3;font-weight:800;color:#0B1B3A;padding-top:1px">${title}</div><div style="font-size:16px;line-height:1.5;color:#4B5565;padding-top:2px">${body}</div></td></tr>`;
const look = (color, k, title, body, href, last) => `<tr><td style="padding:0 0 ${last ? 0 : 10}px"><a href="${href}" style="text-decoration:none;color:#0B1B3A;display:block"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #0B1B3A"><tr>
<td width="8" bgcolor="${color}" style="background:${color};font-size:0;line-height:0">&nbsp;</td>
<td style="padding:13px 14px;${F}"><div style="font-size:11.5px;font-weight:800;letter-spacing:.12em;color:#4B5565">${k}</div><div style="font-size:17.5px;line-height:1.3;font-weight:800;color:#0B1B3A;padding-top:2px">${title}</div><div style="font-size:15px;line-height:1.45;color:#4B5565;padding-top:2px">${body}</div></td>
<td width="44" align="center" valign="middle" style="${F};font-size:20px;font-weight:800;color:#2450DC">&rarr;</td>
</tr></table></a></td></tr>`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>You are on the Countahead early access list</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap" rel="stylesheet">
<style>@media (max-width:480px){.px{padding-left:20px!important;padding-right:20px!important}.q{font-size:20px!important}}</style></head>
<body style="margin:0;padding:0;background:#E9EDF4;${F};color:#0B1B3A;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Your place is saved. One email when early access opens, and one question for you in the meantime.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#E9EDF4" style="background:#E9EDF4"><tr><td align="center" style="padding:28px 10px 40px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse">

<tr><td class="px" style="padding:0 4px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="left" valign="middle"><a href="https://countahead.ai" style="text-decoration:none"><img src="${base}logo-email.png" width="161" height="26" alt="Countahead" style="display:block;border:0;outline:none;width:161px;height:26px;${F};font-size:20px;font-weight:800;color:#0B1B3A"></a></td>
<td align="right" valign="middle" style="${F};font-size:12px;font-weight:800;letter-spacing:.12em;color:#4B5565">THE FORWARD-LOOKING LEDGER</td>
</tr></table></td></tr>

<tr><td style="padding:0;border:1px solid #0B1B3A;border-right:7px solid #2450DC;border-bottom:7px solid #2450DC;background:#FFFFFF" bgcolor="#FFFFFF">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">

<tr><td bgcolor="#0B1B3A" style="background:#0B1B3A;padding:0;font-size:0;line-height:0"><img src="${base}email-hero.jpg" width="600" alt="Early access. You are on the list." style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;${F};font-size:34px;line-height:1.1;font-weight:800;color:#FFFFFF"></td></tr>

<tr><td class="px" style="padding:30px 32px 6px;${F};font-size:18px;line-height:1.55;color:#0B1B3A">Thanks for asking for early access to Countahead.<br><span style="color:#4B5565">One ledger for the books and the plan, so your forecast, runway and board pack read the same numbers.</span></td></tr>

<tr><td class="px" style="padding:26px 32px 12px;${F};font-size:12px;font-weight:800;letter-spacing:.12em;color:#4B5565">WHAT HAPPENS NEXT</td></tr>
<tr><td class="px" style="padding:0 32px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
${step("01", "NOW", "Your place is saved", "There is nothing to log in to yet. Countahead is still being built.", true)}
${step("02", "NEXT", "We build", "The ledger first, then revenue and planning on top of it.")}
${step("03", "THEN", "One email from me", "When early access opens. Nothing in between.", false, true)}
</table></td></tr>

<tr><td style="padding:28px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td class="px" bgcolor="#2450DC" style="background:#2450DC;padding:30px 32px 32px;${F}">
<div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:#FFD15C">ONE QUESTION FOR YOU</div>
<div class="q" style="font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-.01em;color:#FFFFFF;padding-top:10px">What is the one question about your company's numbers that you cannot answer today without waiting for someone?</div>
<div style="font-size:16.5px;line-height:1.5;color:#DCE6FF;padding-top:12px">Reply and tell me. It shapes what gets built first, and I read every answer.</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border-right:5px solid #0B1B3A;border-bottom:5px solid #0B1B3A"><a href="mailto:hello@countahead.ai?subject=The%20question%20I%20cannot%20answer%20today" style="display:inline-block;padding:14px 22px;${F};font-size:16px;font-weight:800;color:#0B1B3A;text-decoration:none">Reply with your question &rarr;</a></td></tr></table>
</td></tr></table></td></tr>

<tr><td class="px" style="padding:30px 32px 12px;${F};font-size:12px;font-weight:800;letter-spacing:.12em;color:#4B5565">WHILE YOU WAIT</td></tr>
<tr><td class="px" style="padding:0 32px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
${look("#0B1B3A", "THE BOOKS", "Statements that are current today", "Agents keep the books inside the rules you set.", "https://countahead.ai/books")}
${look("#2450DC", "THE PLAN", "Change a hire, watch runway move", "Forecast, scenarios and the board pack on the same numbers.", "https://countahead.ai/plan")}
${look("#FFD15C", "REVENUE", "From signed deal to cash", "Contracts, billing and revenue recognition, entered once.", "https://countahead.ai/revenue")}
${look("#8FA8F5", "PRICING", "One price, set by your size", "Planned launch prices, from $49 a month. Not on sale yet.", "https://countahead.ai/pricing", true)}
</table></td></tr>

<tr><td class="px" style="padding:26px 32px 30px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #D5DBE5"><tr><td style="padding-top:20px;${F};font-size:17px;line-height:1.55;color:#0B1B3A">Thank you for being early. Replies to this email come straight to me.</td></tr><tr><td style="padding-top:16px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td width="46" height="46" align="center" valign="middle" bgcolor="#0B1B3A" style="background:#0B1B3A;color:#FFFFFF;${F};font-size:15px;font-weight:800;letter-spacing:.02em">FT</td>
<td style="padding-left:14px;${F}"><div style="font-size:16.5px;font-weight:800;color:#0B1B3A">Felipe Tunnell</div><div style="font-size:15px;line-height:1.4;color:#4B5565">Founder, Countahead &nbsp;&middot;&nbsp; <a href="https://countahead.ai/about" style="color:#2450DC;text-decoration:none;font-weight:700">Why I am building this</a></div></td>
</tr></table></td></tr></table></td></tr>

</table></td></tr>

<tr><td class="px" style="padding:20px 8px 0;${F};font-size:13px;line-height:1.6;color:#6B7486">You are getting this because this address was entered in the early access form at <a href="https://countahead.ai" style="color:#6B7486">countahead.ai</a>. If that was not you, or you want to be removed, just reply and say so.<br>Countahead is a trading name of Oasis Ventures FZE. Product screens on the site use sample data. &nbsp;<a href="https://countahead.ai/privacy" style="color:#6B7486">Privacy</a></td></tr>

</table></td></tr></table></body></html>`;
require("fs").writeFileSync(process.argv[3] || "email.html", html);
console.log(html.length);
