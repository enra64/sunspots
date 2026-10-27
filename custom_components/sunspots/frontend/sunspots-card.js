var X=globalThis,J=X.ShadowRoot&&(X.ShadyCSS===void 0||X.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ye=Symbol(),Xe=new WeakMap,F=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==ye)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(J&&e===void 0){let r=t!==void 0&&t.length===1;r&&(e=Xe.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&Xe.set(t,e))}return e}toString(){return this.cssText}},Je=n=>new F(typeof n=="string"?n:n+"",void 0,ye),M=(n,...e)=>{let t=n.length===1?n[0]:e.reduce((r,i,s)=>r+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+n[s+1],n[0]);return new F(t,n,ye)},Ze=(n,e)=>{if(J)n.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let r=document.createElement("style"),i=X.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=t.cssText,n.appendChild(r)}},_e=J?n=>n:n=>n instanceof CSSStyleSheet?(e=>{let t="";for(let r of e.cssRules)t+=r.cssText;return Je(t)})(n):n;var{is:Wt,defineProperty:Vt,getOwnPropertyDescriptor:qt,getOwnPropertyNames:Yt,getOwnPropertySymbols:Gt,getPrototypeOf:Xt}=Object,Z=globalThis,Qe=Z.trustedTypes,Jt=Qe?Qe.emptyScript:"",Zt=Z.reactiveElementPolyfillSupport,z=(n,e)=>n,be={toAttribute(n,e){switch(e){case Boolean:n=n?Jt:null;break;case Object:case Array:n=n==null?n:JSON.stringify(n)}return n},fromAttribute(n,e){let t=n;switch(e){case Boolean:t=n!==null;break;case Number:t=n===null?null:Number(n);break;case Object:case Array:try{t=JSON.parse(n)}catch{t=null}}return t}},tt=(n,e)=>!Wt(n,e),et={attribute:!0,type:String,converter:be,reflect:!1,useDefault:!1,hasChanged:tt};Symbol.metadata??=Symbol("metadata"),Z.litPropertyMetadata??=new WeakMap;var $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=et){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let r=Symbol(),i=this.getPropertyDescriptor(e,r,t);i!==void 0&&Vt(this.prototype,e,i)}}static getPropertyDescriptor(e,t,r){let{get:i,set:s}=qt(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:i,set(o){let d=i?.call(this);s?.call(this,o),this.requestUpdate(e,d,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??et}static _$Ei(){if(this.hasOwnProperty(z("elementProperties")))return;let e=Xt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(z("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(z("properties"))){let t=this.properties,r=[...Yt(t),...Gt(t)];for(let i of r)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[r,i]of t)this.elementProperties.set(r,i)}this._$Eh=new Map;for(let[t,r]of this.elementProperties){let i=this._$Eu(t,r);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let i of r)t.unshift(_e(i))}else e!==void 0&&t.push(_e(e));return t}static _$Eu(e,t){let r=t.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ze(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){let r=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,r);if(i!==void 0&&r.reflect===!0){let s=(r.converter?.toAttribute!==void 0?r.converter:be).toAttribute(t,r.type);this._$Em=e,s==null?this.removeAttribute(i):this.setAttribute(i,s),this._$Em=null}}_$AK(e,t){let r=this.constructor,i=r._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let s=r.getPropertyOptions(i),o=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:be;this._$Em=i;let d=o.fromAttribute(t,s.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(e,t,r,i=!1,s){if(e!==void 0){let o=this.constructor;if(i===!1&&(s=this[e]),r??=o.getPropertyOptions(e),!((r.hasChanged??tt)(s,t)||r.useDefault&&r.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,r))))return;this.C(e,t,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:i,wrapped:s},o){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),s!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,s]of this._$Ep)this[i]=s;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[i,s]of r){let{wrapped:o}=s,d=this[i];o!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,s,d)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[z("elementProperties")]=new Map,$[z("finalized")]=new Map,Zt?.({ReactiveElement:$}),(Z.reactiveElementVersions??=[]).push("2.1.2");var Ee=globalThis,nt=n=>n,Q=Ee.trustedTypes,rt=Q?Q.createPolicy("lit-html",{createHTML:n=>n}):void 0,ut="$lit$",x=`lit$${Math.random().toFixed(9).slice(2)}$`,lt="?"+x,Qt=`<${lt}>`,R=document,j=()=>R.createComment(""),B=n=>n===null||typeof n!="object"&&typeof n!="function",Me=Array.isArray,en=n=>Me(n)||typeof n?.[Symbol.iterator]=="function",ve=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,it=/-->/g,st=/>/g,k=RegExp(`>|${ve}(?:([^\\s"'>=/]+)(${ve}*=${ve}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ot=/'/g,at=/"/g,ct=/^(?:script|style|textarea|title)$/i,ke=n=>(e,...t)=>({_$litType$:n,strings:e,values:t}),m=ke(1),Pn=ke(2),In=ke(3),T=Symbol.for("lit-noChange"),p=Symbol.for("lit-nothing"),dt=new WeakMap,C=R.createTreeWalker(R,129);function pt(n,e){if(!Me(n)||!n.hasOwnProperty("raw"))throw Error("invalid template strings array");return rt!==void 0?rt.createHTML(e):e}var tn=(n,e)=>{let t=n.length-1,r=[],i,s=e===2?"<svg>":e===3?"<math>":"",o=K;for(let d=0;d<t;d++){let a=n[d],u,c,l=-1,g=0;for(;g<a.length&&(o.lastIndex=g,c=o.exec(a),c!==null);)g=o.lastIndex,o===K?c[1]==="!--"?o=it:c[1]!==void 0?o=st:c[2]!==void 0?(ct.test(c[2])&&(i=RegExp("</"+c[2],"g")),o=k):c[3]!==void 0&&(o=k):o===k?c[0]===">"?(o=i??K,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,u=c[1],o=c[3]===void 0?k:c[3]==='"'?at:ot):o===at||o===ot?o=k:o===it||o===st?o=K:(o=k,i=void 0);let f=o===k&&n[d+1].startsWith("/>")?" ":"";s+=o===K?a+Qt:l>=0?(r.push(u),a.slice(0,l)+ut+a.slice(l)+x+f):a+x+(l===-2?d:f)}return[pt(n,s+(n[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},W=class n{constructor({strings:e,_$litType$:t},r){let i;this.parts=[];let s=0,o=0,d=e.length-1,a=this.parts,[u,c]=tn(e,t);if(this.el=n.createElement(u,r),C.currentNode=this.el.content,t===2||t===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(i=C.nextNode())!==null&&a.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(let l of i.getAttributeNames())if(l.endsWith(ut)){let g=c[o++],f=i.getAttribute(l).split(x),_=/([.?@])?(.*)/.exec(g);a.push({type:1,index:s,name:_[2],strings:f,ctor:_[1]==="."?Se:_[1]==="?"?$e:_[1]==="@"?xe:U}),i.removeAttribute(l)}else l.startsWith(x)&&(a.push({type:6,index:s}),i.removeAttribute(l));if(ct.test(i.tagName)){let l=i.textContent.split(x),g=l.length-1;if(g>0){i.textContent=Q?Q.emptyScript:"";for(let f=0;f<g;f++)i.append(l[f],j()),C.nextNode(),a.push({type:2,index:++s});i.append(l[g],j())}}}else if(i.nodeType===8)if(i.data===lt)a.push({type:2,index:s});else{let l=-1;for(;(l=i.data.indexOf(x,l+1))!==-1;)a.push({type:7,index:s}),l+=x.length-1}s++}}static createElement(e,t){let r=R.createElement("template");return r.innerHTML=e,r}};function O(n,e,t=n,r){if(e===T)return e;let i=r!==void 0?t._$Co?.[r]:t._$Cl,s=B(e)?void 0:e._$litDirective$;return i?.constructor!==s&&(i?._$AO?.(!1),s===void 0?i=void 0:(i=new s(n),i._$AT(n,t,r)),r!==void 0?(t._$Co??=[])[r]=i:t._$Cl=i),i!==void 0&&(e=O(n,i._$AS(n,e.values),i,r)),e}var we=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:r}=this._$AD,i=(e?.creationScope??R).importNode(t,!0);C.currentNode=i;let s=C.nextNode(),o=0,d=0,a=r[0];for(;a!==void 0;){if(o===a.index){let u;a.type===2?u=new V(s,s.nextSibling,this,e):a.type===1?u=new a.ctor(s,a.name,a.strings,this,e):a.type===6&&(u=new Ae(s,this,e)),this._$AV.push(u),a=r[++d]}o!==a?.index&&(s=C.nextNode(),o++)}return C.currentNode=R,i}p(e){let t=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}},V=class n{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,i){this.type=2,this._$AH=p,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=O(this,e,t),B(e)?e===p||e==null||e===""?(this._$AH!==p&&this._$AR(),this._$AH=p):e!==this._$AH&&e!==T&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):en(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==p&&B(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:r}=e,i=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=W.createElement(pt(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(t);else{let s=new we(i,this),o=s.u(this.options);s.p(t),this.T(o),this._$AH=s}}_$AC(e){let t=dt.get(e.strings);return t===void 0&&dt.set(e.strings,t=new W(e)),t}k(e){Me(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,r,i=0;for(let s of e)i===t.length?t.push(r=new n(this.O(j()),this.O(j()),this,this.options)):r=t[i],r._$AI(s),i++;i<t.length&&(this._$AR(r&&r._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let r=nt(e).nextSibling;nt(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},U=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,i,s){this.type=1,this._$AH=p,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=s,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=p}_$AI(e,t=this,r,i){let s=this.strings,o=!1;if(s===void 0)e=O(this,e,t,0),o=!B(e)||e!==this._$AH&&e!==T,o&&(this._$AH=e);else{let d=e,a,u;for(e=s[0],a=0;a<s.length-1;a++)u=O(this,d[r+a],t,a),u===T&&(u=this._$AH[a]),o||=!B(u)||u!==this._$AH[a],u===p?e=p:e!==p&&(e+=(u??"")+s[a+1]),this._$AH[a]=u}o&&!i&&this.j(e)}j(e){e===p?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},Se=class extends U{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===p?void 0:e}},$e=class extends U{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==p)}},xe=class extends U{constructor(e,t,r,i,s){super(e,t,r,i,s),this.type=5}_$AI(e,t=this){if((e=O(this,e,t,0)??p)===T)return;let r=this._$AH,i=e===p&&r!==p||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,s=e!==p&&(r===p||i);i&&this.element.removeEventListener(this.name,this,r),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ae=class{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){O(this,e)}};var nn=Ee.litHtmlPolyfillSupport;nn?.(W,V),(Ee.litHtmlVersions??=[]).push("3.3.3");var mt=(n,e,t)=>{let r=t?.renderBefore??e,i=r._$litPart$;if(i===void 0){let s=t?.renderBefore??null;r._$litPart$=i=new V(e.insertBefore(j(),s),s,void 0,t??{})}return i._$AI(n),i};var Ce=globalThis,v=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=mt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return T}};v._$litElement$=!0,v.finalized=!0,Ce.litElementHydrateSupport?.({LitElement:v});var rn=Ce.litElementPolyfillSupport;rn?.({LitElement:v});(Ce.litElementVersions??=[]).push("4.2.2");function te(n,e){let t;return{call(...r){t!==void 0&&clearTimeout(t),t=setTimeout(()=>{t=void 0,n(...r)},e)},cancel(){t!==void 0&&clearTimeout(t),t=void 0}}}var Re=class{constructor(){this.latest=0}next(){return this.latest+=1,this.latest}isCurrent(e){return e===this.latest}},ee=class{constructor(e,t){this.task=e;this.onSettled=t;this.guard=new Re;this.busy=!1;this.disposed=!1}request(e){this.disposed||(this.pending={arg:e,id:this.guard.next()},this.busy||this.drain())}dispose(){this.disposed=!0,this.pending=void 0}async drain(){for(this.busy=!0;this.pending&&!this.disposed;){let{arg:e,id:t}=this.pending;this.pending=void 0;let r;try{r={ok:!0,value:await this.task(e)}}catch(i){r={ok:!1,error:i}}!this.disposed&&this.guard.isCurrent(t)&&this.onSettled(r)}this.busy=!1}};var ht=["overview","timeline","map"],sn=/^binary_sensor\.[a-z0-9_]+$/,on=["today","tomorrow","both"],an=["auto","light","dark"];var dn={overview:[6,22],timeline:["auto","auto"],map:[4,23]},q=[4,23];function gt(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}function Te(n,e,t){if(n===void 0)return t;if(typeof n!="number"||!Number.isInteger(n)||n<0||n>24)throw new Error(`Invalid configuration: "${e}" must be an integer between 0 and 24`);return n}function ft(n,e,t,r){return n===void 0?t:r&&n==="auto"?n:Te(n,e,0)}function He(n){if(typeof n!="string"||!sn.test(n))throw new Error(`Invalid configuration: "${String(n)}" is not a binary_sensor entity id (use the spot's "..._sunny" entity)`);return n}function yt(n){if(!gt(n))throw new Error("Invalid configuration: expected an object");let e=(()=>{if(n.mode===void 0)return"overview";let f=ht.find(_=>_===n.mode);if(!f)throw new Error(`Invalid configuration: "mode" must be one of ${ht.join(", ")}`);return f})(),{entities:t,entity:r}=n;if(t!==void 0&&r!==void 0)throw new Error('Invalid configuration: use either "entity" or "entities", not both');let i;if(t!==void 0){if(!Array.isArray(t))throw new Error('Invalid configuration: "entities" must be a list of entity ids');i=t.map(He)}else r!==void 0?i=[He(r)]:i=[];if(i.length===0)throw new Error('Invalid configuration: "entity" or "entities" is required');let s=n.title;if(s!==void 0&&typeof s!="string")throw new Error('Invalid configuration: "title" must be a string');let[o,d]=dn[e],a=e==="timeline",u=ft(n.start_hour,"start_hour",o,a),c=ft(n.end_hour,"end_hour",d,a);if(typeof u=="number"&&typeof c=="number"&&u>=c)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');let l=_t(n.day,on,"both","day");return{type:typeof n.type=="string"?n.type:"custom:sunspots-card",mode:e,entities:i,...s!==void 0?{title:s}:{},startHour:u,endHour:c,day:l}}function _t(n,e,t,r){if(n===void 0)return t;let i=e.find(s=>s===n);if(!i)throw new Error(`Invalid configuration: "${r}" must be one of ${e.join(", ")}`);return i}function un(n){if(n===void 0)return 5;if(typeof n!="number"||!Number.isFinite(n))throw new Error('Invalid configuration: "refresh_minutes" must be a number');return Math.min(60,Math.max(1,Math.round(n)))}function bt(n){if(!gt(n))throw new Error("Invalid configuration: expected an object");let{entity:e,entities:t}=n,r=e;if(r===void 0){if(t!==void 0&&!Array.isArray(t))throw new Error('Invalid configuration: "entities" must be a list of entity ids');r=t?.[0]}if(r===void 0)throw new Error('Invalid configuration: "entity" is required');let i=n.title;if(i!==void 0&&typeof i!="string")throw new Error('Invalid configuration: "title" must be a string');let s=n.show_slider;if(s!==void 0&&typeof s!="boolean")throw new Error('Invalid configuration: "show_slider" must be true or false');let o=Te(n.start_hour,"start_hour",q[0]),d=Te(n.end_hour,"end_hour",q[1]);if(o>=d)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');return{type:typeof n.type=="string"?n.type:"custom:sunspots-shadow-card",entity:He(r),...i!==void 0?{title:i}:{},theme:_t(n.theme,an,"auto","theme"),refreshMinutes:un(n.refresh_minutes),showSlider:s===!0,startHour:o,endHour:d}}function P(n,e,t){let r=n.map(([s,o])=>[Math.max(s,e),Math.min(o,t)]).filter(([s,o])=>o>s).sort((s,o)=>s[0]-o[0]),i=[];for(let[s,o]of r){let d=i[i.length-1];d&&s<=d[1]?d[1]=Math.max(d[1],o):i.push([s,o])}return i}function ln(n,e,t){return(n-e)/(t-e)*100}function vt(n){let{windowStart:e,windowEnd:t,now:r}=n,i=P(n.geometry,e,t).map(([d,a])=>({start:d,end:a,kind:"sunny",past:a<=r})),s=[];for(let d of["unlikely","partly","sunny"]){let a=n.forecast.filter(u=>u.kind===d).map(u=>[u.start,u.end]);for(let[u,c]of P(a,e,t))s.push({start:u,end:c,kind:d,past:c<=r})}s.sort((d,a)=>d.start-a.start);let o=r>=e&&r<=t;return{geometry:i,forecast:s,nowPercent:o?ln(r,e,t):void 0}}var ne=1440,cn=[6,22],De={today:0,tomorrow:ne};function re(n){return n==="today"?["today"]:n==="tomorrow"?["tomorrow"]:["today","tomorrow"]}function wt(n,e){return n.map(([t,r])=>[t+e,r+e])}function pn(n){let e=P(n,0,ne),t=e[0],r=e[e.length-1];return!t||!r?cn:[Math.floor(t[0]/60),Math.ceil(r[1]/60)]}function St(n,e,t){let r=pn(t),i=n==="auto"?r[0]:n,s=e==="auto"?r[1]:e;return s<=i&&(s=Math.min(24,i+1),i=s-1),[i,s]}var mn=["sunny","sunny_weather_aware","next_change","sun_remaining","sun_hours_today","sun_forecast","sun_tomorrow"];function hn(n){return mn.some(e=>e===n)}function $t(n,e){let t=n.entities[e];if(!t?.device_id)return;let r={};for(let[i,s]of Object.entries(n.entities))!s||s.device_id!==t.device_id||s.platform!==t.platform||hn(s.translation_key)&&r[s.translation_key]===void 0&&(r[s.translation_key]=i);return r.sunny=e,r}function ie(n,e){return(e.length>0?e:Object.keys(n.entities)).find(r=>{let i=n.entities[r];return r.startsWith("binary_sensor.")&&i?.platform==="sunspots"&&i.translation_key==="sunny"})}function Ne(n){return!n||n.state==="unavailable"||n.state==="unknown"}function Oe(n,e){let t=n?.attributes[e];return typeof t=="string"&&t!==""?t:void 0}function xt(n,e){let t=n?.attributes[e];return typeof t=="number"&&Number.isFinite(t)?t:void 0}var fn={sunny:"Sunny",shaded:"Shaded",sunny_cloudy:"Sun, but cloudy",unavailable:"Unavailable",until:"until {time}",from:"from {time}",tomorrow:"tomorrow",sun_expected_from:"sun expected from {time}",partly_expected_from:"partly sunny from {time}",no_sun_today:"no sun today",sun_hours_today:"{hours} h of sun today",cloud_coverage:"{percent}% clouds",legend_sunny:"Sunny",legend_partly:"Partly sunny",legend_unlikely:"Sun unlikely",legend_geometry:"Sun (no weather forecast)",now:"Now",timeline_bar_alt:"{name}, {day}: {summary}",timeline_none:"no sun in this period",day_today:"Today",day_tomorrow:"Tomorrow",sun_summary:"Sun: {ranges} · {hours}",partly_summary:"Partly sunny: {ranges} · {hours}",no_direct_sun:"No direct sun",first_sun:"first sun {time}",hours_short:"{hours} h",refresh:"Refresh",map_time:"Shown for {time}",map_alt:"Shadow map of {name} at {time}",map_loading:"Loading map…",map_error:"The map could not be loaded: {message}",map_too_large:"The map is too large to display.",map_invalid:"The map response was invalid.",map_sun_below:"The sun is below the horizon.",azimuth:"Azimuth",elevation:"Elevation",entity_missing:"Entity not found: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sun and shade status, timeline and shadow map for your spots",shadow_card_name:"Sunspots shadow map",shadow_card_description:"Current shadow map of one spot, refreshed automatically, with dark mode"},gn={sunny:"Sonnig",shaded:"Schatten",sunny_cloudy:"Sonne, aber bewölkt",unavailable:"Nicht verfügbar",until:"bis {time}",from:"ab {time}",tomorrow:"morgen",sun_expected_from:"Sonne erwartet ab {time}",partly_expected_from:"teils sonnig ab {time}",no_sun_today:"heute keine Sonne",sun_hours_today:"{hours} Std. Sonne heute",cloud_coverage:"{percent} % Wolken",legend_sunny:"Sonnig",legend_partly:"Teils sonnig",legend_unlikely:"Sonne unwahrscheinlich",legend_geometry:"Sonne (ohne Wettervorhersage)",now:"Jetzt",timeline_bar_alt:"{name}, {day}: {summary}",timeline_none:"keine Sonne in diesem Zeitraum",day_today:"Heute",day_tomorrow:"Morgen",sun_summary:"Sonne: {ranges} · {hours}",partly_summary:"Teils sonnig: {ranges} · {hours}",no_direct_sun:"Keine direkte Sonne",first_sun:"erste Sonne {time}",hours_short:"{hours} Std.",refresh:"Aktualisieren",map_time:"Dargestellt für {time}",map_alt:"Schattenkarte von {name} um {time}",map_loading:"Karte wird geladen …",map_error:"Die Karte konnte nicht geladen werden: {message}",map_too_large:"Die Karte ist zu groß für die Anzeige.",map_invalid:"Die Antwort für die Karte war ungültig.",map_sun_below:"Die Sonne steht unter dem Horizont.",azimuth:"Azimut",elevation:"Höhe",entity_missing:"Entität nicht gefunden: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sonnen- und Schattenstatus, Zeitleiste und Schattenkarte für deine Orte",shadow_card_name:"Sunspots Schattenkarte",shadow_card_description:"Aktuelle Schattenkarte eines Ortes, automatisch aktualisiert, mit Dunkelmodus"},yn={en:fn,de:gn};function _n(n){return(n??"en").toLowerCase().split(/[-_]/)[0]||"en"}function h(n,e,t={},r=yn){return(r[_n(n)]?.[e]??r.en?.[e]??e).replace(/\{(\w+)\}/g,(s,o)=>{let d=t[o];return d===void 0?s:String(d)})}function bn(n,e=307200){return typeof n!="string"||n.length===0?{ok:!1,reason:"invalid"}:n.length>e?{ok:!1,reason:"too_large"}:n.length*3>e&&new TextEncoder().encode(n).length>e?{ok:!1,reason:"too_large"}:{ok:!0,svg:n}}function At(n){return typeof n=="number"&&Number.isFinite(n)?n:void 0}function Et(n,e){let r=n?.response?.[e];if(typeof r!="object"||r===null)return{ok:!1,reason:"invalid"};let i=r,s=bn(i.svg);return s.ok?{ok:!0,map:{svg:s.svg,time:typeof i.time=="string"?i.time:void 0,sunAzimuth:At(i.sun_azimuth),sunElevation:At(i.sun_elevation),sunBelowHorizon:i.sun_below_horizon===!0}}:s}function Mt(n,e,t){return{type:"call_service",domain:"sunspots",service:"render_shadow_map",service_data:e===void 0?{theme:t}:{time:e,theme:t},target:{entity_id:n},return_response:!0}}function kt(n){if(typeof n=="string")return n;if(typeof n=="object"&&n!==null&&"message"in n){let e=n.message;if(typeof e=="string"&&e!=="")return e}return"unknown error"}var Ct=new Map;function Rt(n,e){let t=n??"en",r=`${t}|${e.minute??""}`,i=Ct.get(r);if(!i){try{i=new Intl.DateTimeFormat(t,{...e,timeZone:"UTC"})}catch{i=new Intl.DateTimeFormat("en",{...e,timeZone:"UTC"})}Ct.set(r,i)}return i}function Tt(n,e){let t=(Math.round(n)%1440+1440)%1440;return e.format(new Date(t*6e4))}function A(n,e){return Tt(n,Rt(e,{hour:"2-digit",minute:"2-digit"}))}function Ht(n,e){return Tt(n,Rt(e,{hour:"numeric"}))}function Y(n,e){return new Intl.NumberFormat(e??"en",{maximumFractionDigits:1}).format(n)}function Ue(n,e){let t=A(n,e);return n>=1440?`${h(e,"tomorrow")} ${t}`:t}function Pe(n,e,t){return h(t,n,{time:Ue(e,t)})}function Ie(n,e){return`${Y(n,e)}°`}var vn=90,wn=18;function se(n,e,t){return`${A(n,t)}–${A(e,t)}`}function Dt(n,e,t,r){if(n.kind!=="sunny")return;let i=n.end-n.start,s=i/(t-e)*100;if(!(i<vn||s<wn))return se(n.start,n.end,r)}function Sn(n){return n.reduce((e,[t,r])=>e+(r-t),0)}function Nt(n,e,t){let r=P(n,0,ne);return r.length===0?h(t,"no_direct_sun"):h(t,e?"partly_summary":"sun_summary",{ranges:r.map(([i,s])=>se(i,s,t)).join(", "),hours:h(t,"hours_short",{hours:Y(Sn(r)/60,t)})})}function Ot(n,e,t){return e===void 0?n:`${n} · ${h(t,"first_sun",{time:A(e,t)})}`}var Ut=new Map;function $n(n){let e=Ut.get(n);return e||(e=new Intl.DateTimeFormat("en-US",{timeZone:n,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}),Ut.set(n,e)),e}function Le(n,e){let t={};for(let r of $n(e).formatToParts(n))r.type!=="literal"&&(t[r.type]=Number(r.value));return Date.UTC(t.year??1970,(t.month??1)-1,t.day??1,(t.hour??0)%24,t.minute??0,t.second??0)}function Fe(n,e){return Math.floor(Le(n,e)/864e5)*864e5}var xn=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;function oe(n,e,t){if(typeof n!="string")return;let r=xn.exec(n.trim());if(!r)return;let i;if(r[7]===void 0)i=Date.UTC(Number(r[1]),Number(r[2])-1,Number(r[3]),Number(r[4]),Number(r[5]),Number(r[6]??0));else{let s=new Date(n.trim());if(Number.isNaN(s.getTime()))return;i=Le(s,e)}if(!Number.isNaN(i))return(i-t)/6e4}function ae(n,e){return new Date(e+Math.round(n)*6e4).toISOString().slice(0,19)}function Pt(n,e){return(Le(n,e)-Fe(n,e))/6e4}var ze=10,je={sunny:"mdi:white-balance-sunny",shaded:"mdi:weather-sunny-off",sunny_cloudy:"mdi:weather-partly-cloudy",unavailable:"mdi:help-circle-outline"},Ft={sunny:"legend_sunny",partly:"legend_partly",unlikely:"legend_unlikely",geometry:"legend_geometry"};function N(n){return n.locale?.language??n.language??"en"}function We(n,e){let t=Oe(n,"friendly_name");if(!t)return e;let r=t.replace(/\s+(sunny|sonnig)$/i,"").trim();return r===""?t:r}function zt(n,e){let t=n.config.time_zone;return{hass:n,language:N(n),tz:t,dayStart:Fe(e,t),now:Pt(e,t)}}function D(n,e){return oe(e,n.tz,n.dayStart)}function Ke(n,e){if(!Array.isArray(e))return[];let t=[];for(let r of e){let[i,s]=Array.isArray(r)?[r[0],r[1]]:typeof r=="object"&&r!==null?[r.start,r.end]:[void 0,void 0],o=D(n,i),d=D(n,s);o!==void 0&&d!==void 0&&t.push([o,d])}return t}function It(n,e){let t=e?.attributes.windows;if(!Array.isArray(t))return[];let r=[];for(let i of t){if(typeof i!="object"||i===null)continue;let s=i,o=D(n,s.start),d=D(n,s.end),a=s.class;o===void 0||d===void 0||a!=="sunny"&&a!=="partly"&&a!=="unlikely"||r.push({start:o,end:d,kind:a,past:s.past===!0})}return r}function H(n,e){return e===void 0?void 0:n.hass.states[e]}function An(n,e){return Ne(n)?"unavailable":n?.state!=="on"?"shaded":e&&!Ne(e)&&e.state==="off"?"sunny_cloudy":"sunny"}function Kt(n,e,t){let r=H(n,e.sunny_weather_aware),i=An(t,r);return{aware:r,status:i,statusLabel:h(n.language,i),icon:je[i]}}function En(n,e,t){let r=n.hass.states[t],{aware:i,status:s,statusLabel:o,icon:d}=Kt(n,e,r),a=(_,w)=>h(n.language,_,w),u={entityId:t,name:We(r,t),status:s,statusLabel:o,icon:d,extras:[]},c=D(n,H(n,e.next_change)?.state);c!==void 0&&s!=="unavailable"&&(u.boundary=Pe(r?.state==="on"?"until":"from",c,n.language));let l=H(n,e.sun_forecast);if(l?.state==="sunny_later"||l?.state==="partly_later"){let _=l.attributes.best_window,w=typeof _=="object"&&_!==null?D(n,_.start):void 0;w!==void 0&&(u.forecastNote=Pe(l.state==="sunny_later"?"sun_expected_from":"partly_expected_from",w,n.language))}else l?.state==="no_sun_today"&&(u.forecastNote=a("no_sun_today"));let g=Number(H(n,e.sun_hours_today)?.state);H(n,e.sun_hours_today)&&Number.isFinite(g)&&u.extras.push(a("sun_hours_today",{hours:Y(g,n.language)}));let f=xt(i,"cloud_coverage");return f!==void 0&&s!=="shaded"&&s!=="unavailable"&&u.extras.push(a("cloud_coverage",{percent:Math.round(f)})),u}function Mn(n,e,t){let r=[];for(let i=Math.ceil(e/60)*60;i<=t;i+=60){let s=(i-e)/(t-e)*100;r.push(i%120===0?{percent:s,label:Ht(i,n.language)}:{percent:s})}return r}function kn(n,e,t,r){if(r==="today")return{geometry:Ke(n,t?.attributes.intervals_today),windows:It(n,H(n,e.sun_forecast)),firstSun:void 0};let i=De.tomorrow,s=H(n,e.sun_tomorrow),o=t?.attributes.intervals_tomorrow,d=Array.isArray(o)?Ke(n,o):Ke(n,s?.attributes.intervals),a=D(n,s?.state);return{geometry:wt(d,-i),windows:It(n,s).map(u=>({...u,start:u.start-i,end:u.end-i})),firstSun:a===void 0?void 0:a-i}}function Cn(n,e,t,r,i,s){let o=(b,S)=>h(n.language,b,S),d=n.language,a=t.windows.length>0,u=vt({geometry:t.geometry,forecast:t.windows,windowStart:r,windowEnd:i,now:n.now-De[e]}),c=a?u.forecast:u.geometry,l=i-r,g=c.map(b=>{let S=Dt(b,r,i,d);return{left:(b.start-r)/l*100,width:(b.end-b.start)/l*100,kind:b.kind,past:b.past,...S?{label:S}:{}}}),f=b=>o(Ft[b]),_=c.map(b=>`${f(a?b.kind:"geometry")} ${se(b.start,b.end,d)}`),w=b=>t.windows.filter(S=>S.kind===b).map(S=>[S.start,S.end]),G=a?w("sunny"):t.geometry,y=a&&G.length===0,E=Nt(y?w("partly"):G,y,d),Ge=o(e==="today"?"day_today":"day_tomorrow");return{key:e,label:Ge,bars:g,nowPercent:e==="today"?u.nowPercent:void 0,usesForecast:a,summary:e==="tomorrow"?Ot(E,t.firstSun,d):E,ariaLabel:o("timeline_bar_alt",{name:s,day:Ge,summary:_.length>0?_.join("; "):o("timeline_none")})}}function Rn(n,e,t,r){let i=n.hass.states[t],s=We(i,t),o=re(r.day).map(y=>({key:y,data:kn(n,e,i,y)})),d=o.flatMap(({data:y})=>[...y.geometry,...y.windows.map(E=>[E.start,E.end])]),[a,u]=St(r.startHour,r.endHour,d),c=a*60,l=u*60,g=o.map(({key:y,data:E})=>Cn(n,y,E,c,l,s)),f=[];g.some(y=>y.usesForecast)&&f.push("sunny","partly","unlikely"),g.some(y=>!y.usesForecast&&y.bars.length>0)&&f.push("geometry");let{status:_,statusLabel:w,icon:G}=Kt(n,e,i);return{entityId:t,name:s,status:_,statusLabel:w,icon:G,days:g,ticks:Mn(n,c,l),legend:f.map(y=>({kind:y,label:h(n.language,Ft[y])})),nowLabel:h(n.language,"now")}}function Be(n,e,t){return{entityId:e,name:e,error:h(n.language,"entity_missing",{entity:e}),...t}}function Lt(n,e){return typeof n=="number"?n:e}function jt(n,e,t,r,i){let s=n.hass.states[t],o=r*60,d=i*60,a=Math.round(n.now/ze)*ze,u={minMinute:o,maxMinute:d,step:ze,initialMinute:Math.min(d,Math.max(o,a)),dayStart:n.dayStart};if(!s||!e)return Be(n,t,u);let c=Oe(s,"attribution");return{entityId:t,name:We(s,t),...u,...c?{attribution:c}:{}}}function de(n,e){return n.states[e]?$t(n,e):void 0}function ue(n,e,t){let r=zt(n,t);return{title:e.title??h(r.language,"default_title"),map:jt(r,de(n,e.entity),e.entity,e.startHour,e.endHour)}}function Ve(n,e,t){let r=zt(n,t),i=e.title??h(r.language,"default_title");if(e.mode==="map"){let o=e.entities[0],d=Lt(e.startHour,q[0]),a=Lt(e.endHour,q[1]);return{mode:"map",title:i,map:jt(r,de(n,o),o,d,a)}}if(e.mode==="timeline"){let o=e.entities.map(d=>{let a=de(n,d);return a?Rn(r,a,d,e):Be(r,d,{status:"unavailable",statusLabel:"",icon:je.unavailable,days:[],ticks:[],legend:[],nowLabel:""})});return{mode:"timeline",title:i,rows:o}}let s=e.entities.map(o=>{let d=de(n,o);return d?En(r,d,o):Be(r,o,{status:"unavailable",statusLabel:"",icon:je.unavailable,extras:[]})});return{mode:"overview",title:i,rows:s}}var le=class extends Error{constructor(t){super(t);this.reason=t}},I=class{constructor(e,t){this.getHass=e;this.onChange=t;this.current={status:"idle"}}get state(){return this.current}request(e){let t=this.current;this.setState(t.status==="ready"||t.status==="loading"?{status:"loading",...t.url?{url:t.url}:{},...t.map?{map:t.map}:{}}:{status:"loading"}),this.runner??=new ee(r=>this.fetch(r),r=>this.settled(r)),this.runner.request(e)}reset(){this.runner?.dispose(),this.runner=void 0,this.revoke(),this.setState({status:"idle"})}setState(e){this.current=e,this.onChange(e)}revoke(){this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=void 0}async fetch(e){let t=this.getHass();if(!t)throw new Error("not ready");let r=await t.connection.sendMessagePromise(Mt(e.entityId,e.isoTime,e.theme)),i=Et(r,e.entityId);if(!i.ok)throw new le(i.reason);return i.map}settled(e){if(this.revoke(),!e.ok){let t=this.getHass(),r=t?N(t):void 0,i=e.error,s=i instanceof le?h(r,i.reason==="too_large"?"map_too_large":"map_invalid"):h(r,"map_error",{message:kt(i)});this.setState({status:"error",message:s});return}this.objectUrl=URL.createObjectURL(new Blob([e.value.svg],{type:"image/svg+xml"})),this.setState({status:"ready",url:this.objectUrl,map:e.value})}};function Bt(n){return(e,t)=>h(n,e,t)}function ce(n,e,t,r,i){let s=n.status==="ready"||n.status==="loading"?n.map:void 0;if(!s?.time)return A(i,r);let o=oe(s.time,t.config.time_zone,e.dayStart);return o!==void 0?Ue(o,r):s.time}function pe(n,e,t,r){let i=Bt(r),s=n.status==="ready"||n.status==="loading"?n.url:void 0;return m`<div class="mapbox" aria-busy=${n.status==="loading"?"true":"false"}>
    ${s?m`<img src=${s} alt=${i("map_alt",{name:e.name,time:t})} />`:p}
    ${n.status==="loading"?m`<div class="overlay" role="status">${i("map_loading")}</div>`:p}
    ${n.status==="error"?m`<div class="error" role="alert">${n.message}</div>`:p}
  </div>`}function me(n,e,t,r){let i=A(e,t);return m`<label class="slider">
    <span>${n.name} · <strong>${i}</strong></span>
    <input
      type="range"
      .min=${String(n.minMinute)}
      .max=${String(n.maxMinute)}
      .step=${String(n.step)}
      .value=${String(e)}
      aria-valuetext=${i}
      @input=${r}
    />
  </label>`}function he(n,e,t,r){let i=Bt(r),s=n.status==="ready"||n.status==="loading"?n.map:void 0;return m`${s?m`<div class="meta">
        <div>${i("map_time",{time:t})}</div>
        ${s.sunAzimuth!==void 0&&s.sunElevation!==void 0?m`<div>
              ${i("azimuth")}: ${Ie(s.sunAzimuth,r)} · ${i("elevation")}:
              ${Ie(s.sunElevation,r)}
            </div>`:p}
        ${s.sunBelowHorizon?m`<div>${i("map_sun_below")}</div>`:p}
      </div>`:p}
  ${e.attribution?m`<div class="attribution">${e.attribution}</div>`:p}`}var fe=M`
  .content {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--primary-text-color);
  }
  .error {
    color: var(--error-color, #db4437);
  }
  .mapbox {
    position: relative;
    min-height: 120px;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    overflow: hidden;
  }
  .mapbox img {
    display: block;
    width: 100%;
    height: auto;
  }
  .overlay,
  .mapbox .error {
    position: absolute;
    inset: auto 0 0 0;
    padding: 6px 10px;
    background: var(--card-background-color);
    font-size: 0.9em;
  }
  .mapbox .error {
    position: static;
  }
  .overlay {
    color: var(--secondary-text-color);
  }
  .slider {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .slider input {
    width: 100%;
    accent-color: var(--primary-color);
  }
  .meta,
  .attribution {
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }
`;function ge(n,e,t,r){customElements.define(n,e),window.customCards=window.customCards??[],window.customCards.push({type:n,name:h(navigator.language,t),description:h(navigator.language,r)})}function L(n,e){return n==="auto"?e.themes?.darkMode===!0?"dark":"light":n}var Tn=150,qe=class extends v{constructor(){super();this.loader=new I(()=>this.hass,t=>{this._mapState=t});this.debouncer=te(()=>this.loadMap(),Tn);this.dayStart=0;this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(t,r){let i=ie(t,r);return{type:"custom:sunspots-card",mode:"overview",entities:i?[i]:[]}}setConfig(t){this._config=yt(t),this.resetMap()}getCardSize(){let t=this._config;return t?t.mode==="map"?8:t.mode==="timeline"?1+t.entities.length*(1+re(t.day).length*2):1+t.entities.length:1}getGridOptions(){return{columns:12,min_columns:6,rows:(this._config?.mode??"overview")==="map"?6:"auto",min_rows:1}}disconnectedCallback(){super.disconnectedCallback(),this.resetMap()}updated(){let t=this._config,r=this.hass,i=t?.entities[0];if(!r||t?.mode!=="map"||!i)return;let s=`${i}|${L("auto",r)}`;if(this.mapKey===s)return;let o=this.currentModel();o?.mode==="map"&&!o.map.error&&(this.mapKey=s,this.mapEntity=i,this.dayStart=o.map.dayStart,this._minute??=o.map.initialMinute,this.loadMap())}currentModel(){return this.hass&&this._config?Ve(this.hass,this._config,new Date):void 0}loadMap(){let t=this.hass,r=this.mapEntity;!t||!r||this._minute===void 0||this.loader.request({entityId:r,isoTime:ae(this._minute,this.dayStart),theme:L("auto",t)})}resetMap(){this.debouncer.cancel(),this.loader.reset(),this.mapKey=void 0,this.mapEntity=void 0,this._minute=void 0}onSlide(t){this._minute=Number(t.target.value),this.debouncer.call()}render(){if(!this._config||!this.hass)return m`<ha-card></ha-card>`;let t=Ve(this.hass,this._config,new Date),r=N(this.hass);return m`<ha-card .header=${t.title}>
      <div class="content">
        ${t.mode==="overview"?t.rows.map(i=>this.renderOverviewRow(i)):t.mode==="timeline"?this.renderTimeline(t.rows):this.renderMap(t.map,this.hass,r)}
      </div>
    </ha-card>`}renderOverviewRow(t){if(t.error)return m`<div class="row error">${t.error}</div>`;let r=[t.boundary,t.forecastNote,...t.extras].filter(i=>!!i);return m`<div class="row">
      <div class="name">${t.name}</div>
      <div class="chip ${t.status}">
        <ha-icon icon=${t.icon}></ha-icon><span>${t.statusLabel}</span>
      </div>
      ${r.length>0?m`<div class="details">${r.join(" · ")}</div>`:p}
    </div>`}renderTimeline(t){return t.map(r=>r.error?m`<div class="row error">${r.error}</div>`:m`<div class="timeline">
        <div class="head">
          <div class="name">${r.name}</div>
          <div class="chip ${r.status}">
            <ha-icon icon=${r.icon}></ha-icon><span>${r.statusLabel}</span>
          </div>
        </div>
        ${r.days.map(i=>this.renderDay(r,i))}
        <ul class="legend">
          ${r.legend.map(i=>m`<li><span class="swatch seg ${i.kind==="geometry"?"sunny":i.kind}"></span>${i.label}</li>`)}
        </ul>
      </div>`)}renderDay(t,r){return m`<div class="day ${r.key}">
      <div class="daylabel">${r.label}</div>
      <div class="daybody">
        <div class="barwrap">
          <div class="bar" role="img" aria-label=${r.ariaLabel}>
            ${t.ticks.map(i=>m`<div class="grid" style="left:${i.percent}%"></div>`)}
            ${r.bars.map(i=>m`<div
                class="seg ${i.kind} ${i.past?"past":""}"
                style="left:${i.left}%;width:${i.width}%"
              >
                ${i.label?m`<span class="seglabel">${i.label}</span>`:p}
              </div>`)}
          </div>
          ${r.nowPercent!==void 0?m`<div class="now" style="left:${r.nowPercent}%"></div>
                <div class="nowlabel" style="left:${r.nowPercent}%" aria-hidden="true">${t.nowLabel}</div>`:p}
        </div>
        <div class="ticks" aria-hidden="true">
          ${t.ticks.map(i=>i.label?m`<span style="left:${i.percent}%">${i.label}</span>`:p)}
        </div>
        <div class="summary">${r.summary}</div>
      </div>
    </div>`}renderMap(t,r,i){if(t.error)return m`<div class="row error">${t.error}</div>`;let s=this._mapState,o=this._minute??t.initialMinute,d=ce(s,t,r,i,o);return m`${pe(s,t,d,i)}
    ${me(t,o,i,a=>this.onSlide(a))}
    ${he(s,t,d,i)}`}static{this.styles=[fe,M`
      :host {
        --sunspots-sun: var(--amber-color, var(--warning-color, #f5a623));
        --sunspots-on-sun: #1c1c1c;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 12px;
      }
      .row .name {
        flex: 1 1 8em;
        font-weight: 500;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .details {
        flex: 1 1 100%;
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 10px 2px 6px;
        border-radius: 16px;
        border: 1px solid var(--divider-color);
        font-size: 0.9em;
        white-space: nowrap;
      }
      .chip.sunny {
        border-color: var(--sunspots-sun);
        background: color-mix(in srgb, var(--sunspots-sun) 18%, transparent);
      }
      .chip.sunny_cloudy {
        border-color: var(--sunspots-sun);
        border-style: dashed;
      }
      .chip ha-icon {
        --mdc-icon-size: 18px;
      }
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 4px 12px;
      }
      .head .name {
        font-weight: 500;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .day {
        display: grid;
        grid-template-columns: 4.5em minmax(0, 1fr);
        column-gap: 8px;
      }
      .day.today {
        padding-top: 16px;
      }
      .daylabel {
        line-height: 28px;
        font-size: 0.9em;
        font-weight: 500;
      }
      .barwrap {
        position: relative;
      }
      .bar {
        position: relative;
        height: 28px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
        background: var(--secondary-background-color, transparent);
        overflow: hidden;
      }
      .grid {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--divider-color);
        opacity: 0.6;
      }
      .seg {
        position: absolute;
        top: 0;
        bottom: 0;
      }
      .seg.sunny {
        background: var(--sunspots-sun);
        color: var(--sunspots-on-sun);
      }
      .seg.partly {
        background: repeating-linear-gradient(45deg, var(--sunspots-sun) 0 4px, transparent 4px 8px);
        border-left: 1px solid var(--sunspots-sun);
        border-right: 1px solid var(--sunspots-sun);
      }
      .seg.unlikely {
        background: color-mix(in srgb, var(--sunspots-sun) 22%, transparent);
        border-top: 2px dotted var(--sunspots-sun);
        border-bottom: 2px dotted var(--sunspots-sun);
        box-sizing: border-box;
      }
      .seg.past:not(.swatch) {
        opacity: 0.55;
      }
      .seglabel {
        display: block;
        padding: 0 4px;
        line-height: 28px;
        font-size: 0.8em;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .now {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 3px;
        margin-left: -1.5px;
        border-radius: 2px;
        background: var(--primary-text-color);
        box-shadow: 0 0 0 1px var(--card-background-color, transparent);
      }
      .nowlabel {
        position: absolute;
        bottom: calc(100% + 4px);
        transform: translateX(-50%);
        font-size: 0.75em;
        font-weight: 600;
        line-height: 1;
        color: var(--primary-text-color);
      }
      .ticks {
        position: relative;
        height: 1.2em;
        margin-top: 2px;
        font-size: 0.7em;
        color: var(--secondary-text-color);
      }
      .ticks span {
        position: absolute;
        transform: translateX(-50%);
        white-space: nowrap;
      }
      .summary {
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }
      .legend {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 4px 16px;
        font-size: 0.85em;
        color: var(--secondary-text-color);
      }
      .legend li {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .swatch {
        position: static;
        display: inline-block;
        width: 24px;
        height: 12px;
        border: 1px solid var(--divider-color);
      }
    `]}};ge("sunspots-card",qe,"card_name","card_description");var Hn=150,Ye=class extends v{constructor(){super();this.loader=new I(()=>this.hass,t=>{this._mapState=t});this.debouncer=te(()=>this.load(),Hn);this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(t,r){return{type:"custom:sunspots-shadow-card",entity:ie(t,r)??""}}setConfig(t){this._config=bt(t),this.stop(),this.loader.reset(),this._minute=void 0,this.loadedKey=void 0,this.isConnected&&this.arm()}getCardSize(){return this._config?.showSlider?8:6}getGridOptions(){return{columns:12,min_columns:6,rows:this._config?.showSlider?6:5,min_rows:2}}connectedCallback(){super.connectedCallback(),this.arm(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),this.stop(),this.loader.reset(),this.loadedKey=void 0}updated(){let t=this._config,r=this.hass;if(!t||!r||!this.isConnected)return;let i=`${t.entity}|${L(t.theme,r)}`;if(this.loadedKey===i)return;let{map:s}=ue(r,t,new Date);s.error||(this.loadedKey=i,this.load())}arm(){this.stop();let t=this._config?.refreshMinutes;t!==void 0&&(this.timer=setInterval(()=>this.load(),t*6e4))}stop(){this.debouncer.cancel(),this.timer!==void 0&&clearInterval(this.timer),this.timer=void 0}load(){let t=this._config,r=this.hass;if(!t||!r)return;let{dayStart:i}=ue(r,t,new Date).map;this.loader.request({entityId:t.entity,isoTime:this._minute===void 0?void 0:ae(this._minute,i),theme:L(t.theme,r)})}onRefresh(){this._minute=void 0,this.load()}onSlide(t){this._minute=Number(t.target.value),this.debouncer.call()}render(){let t=this._config,r=this.hass;if(!t||!r)return m`<ha-card></ha-card>`;let{title:i,map:s}=ue(r,t,new Date),o=N(r);if(s.error)return m`<ha-card .header=${i}><div class="content error">${s.error}</div></ha-card>`;let d=this._mapState,a=this._minute??s.initialMinute,u=ce(d,s,r,o,a);return m`<ha-card .header=${i}>
      <div class="content">
        ${pe(d,s,u,o)}
        ${t.showSlider?me(s,a,o,c=>this.onSlide(c)):p}
        <div class="footer">
          <div class="caption">${he(d,s,u,o)}</div>
          <button
            class="refresh"
            type="button"
            title=${h(o,"refresh")}
            aria-label=${h(o,"refresh")}
            @click=${()=>this.onRefresh()}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
          </button>
        </div>
      </div>
    </ha-card>`}static{this.styles=[fe,M`
      .footer {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
      }
      .caption {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .refresh {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
      }
      .refresh:hover,
      .refresh:focus-visible {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }
    `]}};ge("sunspots-shadow-card",Ye,"shadow_card_name","shadow_card_description");
