// The site owner's mark is separate from each game's original creator attribution.
export function renderOwnership({compact=false}={}){
 return `<!-- ownership:start --><div class="ownership-signature site-copyright${compact?' ownership-signature--compact':''}" lang="en" dir="ltr"><img class="owner-monogram" src="/assets/yha-monogram.svg" width="160" height="84" alt="" aria-hidden="true" loading="lazy"><div class="owner-copy"><span class="owner-name">Yahia Hatem Abdullah</span><span class="owner-rights">© 2026 ZYVOQIX · All rights reserved.</span></div></div><!-- ownership:end -->`;
}
