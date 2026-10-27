var ne=globalThis,re=ne.ShadowRoot&&(ne.ShadyCSS===void 0||ne.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Ce=Symbol(),ut=new WeakMap,q=class{constructor(e,n,r){if(this._$cssResult$=!0,r!==Ce)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o,n=this.t;if(re&&e===void 0){let r=n!==void 0&&n.length===1;r&&(e=ut.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&ut.set(n,e))}return e}toString(){return this.cssText}},lt=t=>new q(typeof t=="string"?t:t+"",void 0,Ce),M=(t,...e)=>{let n=t.length===1?t[0]:e.reduce((r,o,i)=>r+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+t[i+1],t[0]);return new q(n,t,Ce)},ct=(t,e)=>{if(re)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(let n of e){let r=document.createElement("style"),o=ne.litNonce;o!==void 0&&r.setAttribute("nonce",o),r.textContent=n.cssText,t.appendChild(r)}},Re=re?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(let r of e.cssRules)n+=r.cssText;return lt(n)})(t):t;var{is:yn,defineProperty:bn,getOwnPropertyDescriptor:wn,getOwnPropertyNames:vn,getOwnPropertySymbols:Sn,getPrototypeOf:xn}=Object,oe=globalThis,mt=oe.trustedTypes,$n=mt?mt.emptyScript:"",En=oe.reactiveElementPolyfillSupport,V=(t,e)=>t,Ae={toAttribute(t,e){switch(e){case Boolean:t=t?$n:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},ht=(t,e)=>!yn(t,e),pt={attribute:!0,type:String,converter:Ae,reflect:!1,useDefault:!1,hasChanged:ht};Symbol.metadata??=Symbol("metadata"),oe.litPropertyMetadata??=new WeakMap;var $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=pt){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){let r=Symbol(),o=this.getPropertyDescriptor(e,r,n);o!==void 0&&bn(this.prototype,e,o)}}static getPropertyDescriptor(e,n,r){let{get:o,set:i}=wn(this.prototype,e)??{get(){return this[n]},set(s){this[n]=s}};return{get:o,set(s){let a=o?.call(this);i?.call(this,s),this.requestUpdate(e,a,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??pt}static _$Ei(){if(this.hasOwnProperty(V("elementProperties")))return;let e=xn(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(V("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(V("properties"))){let n=this.properties,r=[...vn(n),...Sn(n)];for(let o of r)this.createProperty(o,n[o])}let e=this[Symbol.metadata];if(e!==null){let n=litPropertyMetadata.get(e);if(n!==void 0)for(let[r,o]of n)this.elementProperties.set(r,o)}this._$Eh=new Map;for(let[n,r]of this.elementProperties){let o=this._$Eu(n,r);o!==void 0&&this._$Eh.set(o,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let n=[];if(Array.isArray(e)){let r=new Set(e.flat(1/0).reverse());for(let o of r)n.unshift(Re(o))}else e!==void 0&&n.push(Re(e));return n}static _$Eu(e,n){let r=n.attribute;return r===!1?void 0:typeof r=="string"?r:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,n=this.constructor.elementProperties;for(let r of n.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ct(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,n,r){this._$AK(e,r)}_$ET(e,n){let r=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,r);if(o!==void 0&&r.reflect===!0){let i=(r.converter?.toAttribute!==void 0?r.converter:Ae).toAttribute(n,r.type);this._$Em=e,i==null?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(e,n){let r=this.constructor,o=r._$Eh.get(e);if(o!==void 0&&this._$Em!==o){let i=r.getPropertyOptions(o),s=typeof i.converter=="function"?{fromAttribute:i.converter}:i.converter?.fromAttribute!==void 0?i.converter:Ae;this._$Em=o;let a=s.fromAttribute(n,i.type);this[o]=a??this._$Ej?.get(o)??a,this._$Em=null}}requestUpdate(e,n,r,o=!1,i){if(e!==void 0){let s=this.constructor;if(o===!1&&(i=this[e]),r??=s.getPropertyOptions(e),!((r.hasChanged??ht)(i,n)||r.useDefault&&r.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,r))))return;this.C(e,n,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:r,reflect:o,wrapped:i},s){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??n??this[e]),i!==!0||s!==void 0)||(this._$AL.has(e)||(this.hasUpdated||r||(n=void 0),this._$AL.set(e,n)),o===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[o,i]of this._$Ep)this[o]=i;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[o,i]of r){let{wrapped:s}=i,a=this[o];s!==!0||this._$AL.has(o)||a===void 0||this.C(o,void 0,i,a)}}let e=!1,n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(n)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(n)}willUpdate(e){}_$AE(e){this._$EO?.forEach(n=>n.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(n=>this._$ET(n,this[n])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[V("elementProperties")]=new Map,$[V("finalized")]=new Map,En?.({ReactiveElement:$}),(oe.reactiveElementVersions??=[]).push("2.1.2");var Ne=globalThis,ft=t=>t,ie=Ne.trustedTypes,gt=ie?ie.createPolicy("lit-html",{createHTML:t=>t}):void 0,St="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+C,Cn=`<${xt}>`,H=document,X=()=>H.createComment(""),Z=t=>t===null||typeof t!="object"&&typeof t!="function",Ue=Array.isArray,Rn=t=>Ue(t)||typeof t?.[Symbol.iterator]=="function",Me=`[ 	
\f\r]`,G=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_t=/-->/g,yt=/>/g,k=RegExp(`>|${Me}(?:([^\\s"'>=/]+)(${Me}*=${Me}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),bt=/'/g,wt=/"/g,$t=/^(?:script|style|textarea|title)$/i,Le=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),p=Le(1),vr=Le(2),Sr=Le(3),D=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),vt=new WeakMap,T=H.createTreeWalker(H,129);function Et(t,e){if(!Ue(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return gt!==void 0?gt.createHTML(e):e}var An=(t,e)=>{let n=t.length-1,r=[],o,i=e===2?"<svg>":e===3?"<math>":"",s=G;for(let a=0;a<n;a++){let d=t[a],u,c,l=-1,f=0;for(;f<d.length&&(s.lastIndex=f,c=s.exec(d),c!==null);)f=s.lastIndex,s===G?c[1]==="!--"?s=_t:c[1]!==void 0?s=yt:c[2]!==void 0?($t.test(c[2])&&(o=RegExp("</"+c[2],"g")),s=k):c[3]!==void 0&&(s=k):s===k?c[0]===">"?(s=o??G,l=-1):c[1]===void 0?l=-2:(l=s.lastIndex-c[2].length,u=c[1],s=c[3]===void 0?k:c[3]==='"'?wt:bt):s===wt||s===bt?s=k:s===_t||s===yt?s=G:(s=k,o=void 0);let g=s===k&&t[a+1].startsWith("/>")?" ":"";i+=s===G?d+Cn:l>=0?(r.push(u),d.slice(0,l)+St+d.slice(l)+C+g):d+C+(l===-2?a:g)}return[Et(t,i+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),r]},J=class t{constructor({strings:e,_$litType$:n},r){let o;this.parts=[];let i=0,s=0,a=e.length-1,d=this.parts,[u,c]=An(e,n);if(this.el=t.createElement(u,r),T.currentNode=this.el.content,n===2||n===3){let l=this.el.content.firstChild;l.replaceWith(...l.childNodes)}for(;(o=T.nextNode())!==null&&d.length<a;){if(o.nodeType===1){if(o.hasAttributes())for(let l of o.getAttributeNames())if(l.endsWith(St)){let f=c[s++],g=o.getAttribute(l).split(C),y=/([.?@])?(.*)/.exec(f);d.push({type:1,index:i,name:y[2],strings:g,ctor:y[1]==="."?Te:y[1]==="?"?He:y[1]==="@"?De:I}),o.removeAttribute(l)}else l.startsWith(C)&&(d.push({type:6,index:i}),o.removeAttribute(l));if($t.test(o.tagName)){let l=o.textContent.split(C),f=l.length-1;if(f>0){o.textContent=ie?ie.emptyScript:"";for(let g=0;g<f;g++)o.append(l[g],X()),T.nextNode(),d.push({type:2,index:++i});o.append(l[f],X())}}}else if(o.nodeType===8)if(o.data===xt)d.push({type:2,index:i});else{let l=-1;for(;(l=o.data.indexOf(C,l+1))!==-1;)d.push({type:7,index:i}),l+=C.length-1}i++}}static createElement(e,n){let r=H.createElement("template");return r.innerHTML=e,r}};function P(t,e,n=t,r){if(e===D)return e;let o=r!==void 0?n._$Co?.[r]:n._$Cl,i=Z(e)?void 0:e._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),i===void 0?o=void 0:(o=new i(t),o._$AT(t,n,r)),r!==void 0?(n._$Co??=[])[r]=o:n._$Cl=o),o!==void 0&&(e=P(t,o._$AS(t,e.values),o,r)),e}var ke=class{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:n},parts:r}=this._$AD,o=(e?.creationScope??H).importNode(n,!0);T.currentNode=o;let i=T.nextNode(),s=0,a=0,d=r[0];for(;d!==void 0;){if(s===d.index){let u;d.type===2?u=new Q(i,i.nextSibling,this,e):d.type===1?u=new d.ctor(i,d.name,d.strings,this,e):d.type===6&&(u=new Oe(i,this,e)),this._$AV.push(u),d=r[++a]}s!==d?.index&&(i=T.nextNode(),s++)}return T.currentNode=H,o}p(e){let n=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(e,r,n),n+=r.strings.length-2):r._$AI(e[n])),n++}},Q=class t{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,n,r,o){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=r,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,n=this._$AM;return n!==void 0&&e?.nodeType===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=P(this,e,n),Z(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==D&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Rn(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&Z(this._$AH)?this._$AA.nextSibling.data=e:this.T(H.createTextNode(e)),this._$AH=e}$(e){let{values:n,_$litType$:r}=e,o=typeof r=="number"?this._$AC(e):(r.el===void 0&&(r.el=J.createElement(Et(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===o)this._$AH.p(n);else{let i=new ke(o,this),s=i.u(this.options);i.p(n),this.T(s),this._$AH=i}}_$AC(e){let n=vt.get(e.strings);return n===void 0&&vt.set(e.strings,n=new J(e)),n}k(e){Ue(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,o=0;for(let i of e)o===n.length?n.push(r=new t(this.O(X()),this.O(X()),this,this.options)):r=n[o],r._$AI(i),o++;o<n.length&&(this._$AR(r&&r._$AB.nextSibling,o),n.length=o)}_$AR(e=this._$AA.nextSibling,n){for(this._$AP?.(!1,!0,n);e!==this._$AB;){let r=ft(e).nextSibling;ft(e).remove(),e=r}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},I=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,r,o,i){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=n,this._$AM=o,this.options=i,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=m}_$AI(e,n=this,r,o){let i=this.strings,s=!1;if(i===void 0)e=P(this,e,n,0),s=!Z(e)||e!==this._$AH&&e!==D,s&&(this._$AH=e);else{let a=e,d,u;for(e=i[0],d=0;d<i.length-1;d++)u=P(this,a[r+d],n,d),u===D&&(u=this._$AH[d]),s||=!Z(u)||u!==this._$AH[d],u===m?e=m:e!==m&&(e+=(u??"")+i[d+1]),this._$AH[d]=u}s&&!o&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},Te=class extends I{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}},He=class extends I{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}},De=class extends I{constructor(e,n,r,o,i){super(e,n,r,o,i),this.type=5}_$AI(e,n=this){if((e=P(this,e,n,0)??m)===D)return;let r=this._$AH,o=e===m&&r!==m||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,i=e!==m&&(r===m||o);o&&this.element.removeEventListener(this.name,this,r),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Oe=class{constructor(e,n,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){P(this,e)}};var Mn=Ne.litHtmlPolyfillSupport;Mn?.(J,Q),(Ne.litHtmlVersions??=[]).push("3.3.3");var Ct=(t,e,n)=>{let r=n?.renderBefore??e,o=r._$litPart$;if(o===void 0){let i=n?.renderBefore??null;r._$litPart$=o=new Q(e.insertBefore(X(),i),i,void 0,n??{})}return o._$AI(t),o};var Pe=globalThis,v=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ct(n,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return D}};v._$litElement$=!0,v.finalized=!0,Pe.litElementHydrateSupport?.({LitElement:v});var kn=Pe.litElementPolyfillSupport;kn?.({LitElement:v});(Pe.litElementVersions??=[]).push("4.2.2");function ae(t,e){let n;return{call(...r){n!==void 0&&clearTimeout(n),n=setTimeout(()=>{n=void 0,t(...r)},e)},cancel(){n!==void 0&&clearTimeout(n),n=void 0}}}var Ie=class{constructor(){this.latest=0}next(){return this.latest+=1,this.latest}isCurrent(e){return e===this.latest}},se=class{constructor(e,n){this.task=e;this.onSettled=n;this.guard=new Ie;this.busy=!1;this.disposed=!1}request(e){this.disposed||(this.pending={arg:e,id:this.guard.next()},this.busy||this.drain())}dispose(){this.disposed=!0,this.pending=void 0}async drain(){for(this.busy=!0;this.pending&&!this.disposed;){let{arg:e,id:n}=this.pending;this.pending=void 0;let r;try{r={ok:!0,value:await this.task(e)}}catch(o){r={ok:!1,error:o}}!this.disposed&&this.guard.isCurrent(n)&&this.onSettled(r)}this.busy=!1}};var Rt=["overview","timeline","map"],Tn=/^binary_sensor\.[a-z0-9_]+$/,Hn=["auto","light","dark"];var ze={overview:[6,22],timeline:["auto","auto"],map:[4,23]},S=[4,23];function Mt(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function Fe(t,e,n){if(t===void 0)return n;if(typeof t!="number"||!Number.isInteger(t)||t<0||t>24)throw new Error(`Invalid configuration: "${e}" must be an integer between 0 and 24`);return t}function At(t,e,n,r){return t===void 0?n:r&&t==="auto"?t:Fe(t,e,0)}function Ke(t){if(typeof t!="string"||!Tn.test(t))throw new Error(`Invalid configuration: "${String(t)}" is not a binary_sensor entity id (use the spot's "..._sunny" entity)`);return t}function kt(t){if(!Mt(t))throw new Error("Invalid configuration: expected an object");let e=(()=>{if(t.mode===void 0)return"overview";let w=Rt.find(L=>L===t.mode);if(!w)throw new Error(`Invalid configuration: "mode" must be one of ${Rt.join(", ")}`);return w})(),{entities:n,entity:r}=t;if(n!==void 0&&r!==void 0)throw new Error('Invalid configuration: use either "entity" or "entities", not both');let o;if(n!==void 0){if(!Array.isArray(n))throw new Error('Invalid configuration: "entities" must be a list of entity ids');o=n.map(Ke)}else r!==void 0?o=[Ke(r)]:o=[];if(o.length===0)throw new Error('Invalid configuration: "entity" or "entities" is required');let i=t.title;if(i!==void 0&&typeof i!="string")throw new Error('Invalid configuration: "title" must be a string');let[s,a]=ze[e],d=e==="timeline",u=At(t.start_hour,"start_hour",s,d),c=At(t.end_hour,"end_hour",a,d);if(typeof u=="number"&&typeof c=="number"&&u>=c)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');let l=de(t.show_today,"show_today",!0),f=de(t.show_tomorrow,"show_tomorrow",!0);if(e==="timeline"&&!l&&!f)throw new Error('Invalid configuration: "show_today" and "show_tomorrow" cannot both be false, show at least one day');let g=de(t.full_day,"full_day",!1);return{type:typeof t.type=="string"?t.type:"custom:sunspots-card",mode:e,entities:o,...i!==void 0?{title:i}:{},startHour:u,endHour:c,showToday:l,showTomorrow:f,fullDay:g}}function de(t,e,n){if(t===void 0)return n;if(typeof t!="boolean")throw new Error(`Invalid configuration: "${e}" must be true or false`);return t}function Dn(t,e,n,r){if(t===void 0)return n;let o=e.find(i=>i===t);if(!o)throw new Error(`Invalid configuration: "${r}" must be one of ${e.join(", ")}`);return o}function On(t){if(t===void 0)return 5;if(typeof t!="number"||!Number.isFinite(t))throw new Error('Invalid configuration: "refresh_minutes" must be a number');return Math.min(60,Math.max(1,Math.round(t)))}function Tt(t){if(!Mt(t))throw new Error("Invalid configuration: expected an object");let{entity:e,entities:n}=t,r=e;if(r===void 0){if(n!==void 0&&!Array.isArray(n))throw new Error('Invalid configuration: "entities" must be a list of entity ids');r=n?.[0]}if(r===void 0)throw new Error('Invalid configuration: "entity" is required');let o=t.title;if(o!==void 0&&typeof o!="string")throw new Error('Invalid configuration: "title" must be a string');let i=de(t.show_slider,"show_slider",!1),s=Fe(t.start_hour,"start_hour",S[0]),a=Fe(t.end_hour,"end_hour",S[1]);if(s>=a)throw new Error('Invalid configuration: "start_hour" must be smaller than "end_hour"');return{type:typeof t.type=="string"?t.type:"custom:sunspots-shadow-card",entity:Ke(r),...o!==void 0?{title:o}:{},theme:Dn(t.theme,Hn,"auto","theme"),refreshMinutes:On(t.refresh_minutes),showSlider:i,startHour:s,endHour:a}}var Nn={sunny:"Sunny",shaded:"Shaded",sunny_cloudy:"Sun, but cloudy",unavailable:"Unavailable",until:"until {time}",from:"from {time}",tomorrow:"tomorrow",sun_expected_from:"sun expected from {time}",partly_expected_from:"partly sunny from {time}",no_sun_today:"no sun today",sun_hours_today:"{hours} h of sun today",cloud_coverage:"{percent}% clouds",legend_sunny:"Sunny",legend_partly:"Partly sunny",legend_unlikely:"Sun unlikely",legend_geometry:"Sun (no weather forecast)",now:"Now",timeline_bar_alt:"{name}, {day}: {summary}",timeline_none:"no sun in this period",day_today:"Today",day_tomorrow:"Tomorrow",sun_summary:"Sun: {ranges} · {hours}",partly_summary:"Partly sunny: {ranges} · {hours}",no_direct_sun:"No direct sun",first_sun:"first sun {time}",hours_short:"{hours} h",refresh:"Refresh",map_time:"Shown for {time}",map_alt:"Shadow map of {name} at {time}",map_loading:"Loading map…",map_error:"The map could not be loaded: {message}",map_too_large:"The map is too large to display.",map_invalid:"The map response was invalid.",map_sun_below:"The sun is below the horizon.",azimuth:"Azimuth",elevation:"Elevation",entity_missing:"Entity not found: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sun and shade status, timeline and shadow map for your spots",shadow_card_name:"Sunspots shadow map",shadow_card_description:"Current shadow map of one spot, refreshed automatically, with dark mode",editor_mode:"Card view",editor_mode_overview:"Overview",editor_mode_timeline:"Timeline",editor_mode_map:"Shadow map",editor_entities:"Spots",editor_entities_helper:"Sunny sensors (binary_sensor.<spot>_sunny) of the Sunspots integration",editor_entity:"Spot",editor_entity_helper:"The spot's sunny sensor (binary_sensor.<spot>_sunny)",editor_title:"Title",editor_show_today:"Show today",editor_show_tomorrow:"Show tomorrow",editor_full_day:"Full day (0-24 h)",editor_full_day_helper:"Always shows the whole day, ignoring start and end hour",editor_start_hour:"Start hour",editor_end_hour:"End hour",editor_hours_helper_timeline:"Hour 0-24; empty means automatic",editor_hours_helper_slider:"Hour 0-24 for the time slider range",editor_theme:"Theme of the map",editor_theme_helper:"Automatic follows the Home Assistant dark mode",editor_theme_auto:"Automatic",editor_theme_light:"Light",editor_theme_dark:"Dark",editor_refresh_minutes:"Refresh interval (minutes)",editor_refresh_minutes_helper:"1 to 60 minutes",editor_show_slider:"Show time slider"},Un={sunny:"Sonnig",shaded:"Schatten",sunny_cloudy:"Sonne, aber bewölkt",unavailable:"Nicht verfügbar",until:"bis {time}",from:"ab {time}",tomorrow:"morgen",sun_expected_from:"Sonne erwartet ab {time}",partly_expected_from:"teils sonnig ab {time}",no_sun_today:"heute keine Sonne",sun_hours_today:"{hours} Std. Sonne heute",cloud_coverage:"{percent} % Wolken",legend_sunny:"Sonnig",legend_partly:"Teils sonnig",legend_unlikely:"Sonne unwahrscheinlich",legend_geometry:"Sonne (ohne Wettervorhersage)",now:"Jetzt",timeline_bar_alt:"{name}, {day}: {summary}",timeline_none:"keine Sonne in diesem Zeitraum",day_today:"Heute",day_tomorrow:"Morgen",sun_summary:"Sonne: {ranges} · {hours}",partly_summary:"Teils sonnig: {ranges} · {hours}",no_direct_sun:"Keine direkte Sonne",first_sun:"erste Sonne {time}",hours_short:"{hours} Std.",refresh:"Aktualisieren",map_time:"Dargestellt für {time}",map_alt:"Schattenkarte von {name} um {time}",map_loading:"Karte wird geladen …",map_error:"Die Karte konnte nicht geladen werden: {message}",map_too_large:"Die Karte ist zu groß für die Anzeige.",map_invalid:"Die Antwort für die Karte war ungültig.",map_sun_below:"Die Sonne steht unter dem Horizont.",azimuth:"Azimut",elevation:"Höhe",entity_missing:"Entität nicht gefunden: {entity}",default_title:"Sunspots",card_name:"Sunspots",card_description:"Sonnen- und Schattenstatus, Zeitleiste und Schattenkarte für deine Orte",shadow_card_name:"Sunspots Schattenkarte",shadow_card_description:"Aktuelle Schattenkarte eines Ortes, automatisch aktualisiert, mit Dunkelmodus",editor_mode:"Ansicht",editor_mode_overview:"Übersicht",editor_mode_timeline:"Zeitleiste",editor_mode_map:"Schattenkarte",editor_entities:"Orte",editor_entities_helper:"Sonnig-Sensoren (binary_sensor.<ort>_sunny) der Sunspots-Integration",editor_entity:"Ort",editor_entity_helper:"Der Sonnig-Sensor des Ortes (binary_sensor.<ort>_sunny)",editor_title:"Titel",editor_show_today:"Heute anzeigen",editor_show_tomorrow:"Morgen anzeigen",editor_full_day:"Ganzer Tag (0-24 Uhr)",editor_full_day_helper:"Zeigt immer den ganzen Tag, Start- und Endstunde werden ignoriert",editor_start_hour:"Startstunde",editor_end_hour:"Endstunde",editor_hours_helper_timeline:"Stunde 0-24; leer bedeutet automatisch",editor_hours_helper_slider:"Stunde 0-24 für den Bereich des Zeitreglers",editor_theme:"Darstellung der Karte",editor_theme_helper:"Automatisch folgt dem Dunkelmodus von Home Assistant",editor_theme_auto:"Automatisch",editor_theme_light:"Hell",editor_theme_dark:"Dunkel",editor_refresh_minutes:"Aktualisierung (Minuten)",editor_refresh_minutes_helper:"1 bis 60 Minuten",editor_show_slider:"Zeitregler anzeigen"},Ln={en:Nn,de:Un};function Pn(t){return(t??"en").toLowerCase().split(/[-_]/)[0]||"en"}function h(t,e,n={},r=Ln){return(r[Pn(t)]?.[e]??r.en?.[e]??e).replace(/\{(\w+)\}/g,(i,s)=>{let a=n[s];return a===void 0?i:String(a)})}var In={mode:"editor_mode",entities:"editor_entities",entity:"editor_entity",title:"editor_title",show_today:"editor_show_today",show_tomorrow:"editor_show_tomorrow",full_day:"editor_full_day",start_hour:"editor_start_hour",end_hour:"editor_end_hour",theme:"editor_theme",refresh_minutes:"editor_refresh_minutes",show_slider:"editor_show_slider"},Fn={entities:"editor_entities_helper",entity:"editor_entity_helper",full_day:"editor_full_day_helper",theme:"editor_theme_helper",refresh_minutes:"editor_refresh_minutes_helper"},Kn={overview:"editor_mode_overview",timeline:"editor_mode_timeline",map:"editor_mode_map"},zn={auto:"editor_theme_auto",light:"editor_theme_light",dark:"editor_theme_dark"},F={number:{min:0,max:24,step:1,mode:"box"}};function K(t){let e=t.mode;return e==="timeline"||e==="map"?e:"overview"}function Ht(t,e){return Object.keys(t).map(n=>({value:n,label:h(e,t[n])}))}function Dt(t,e){let n=K(t),r=[{name:"mode",selector:{select:{mode:"dropdown",options:Ht(Kn,e)}}},{name:"entities",required:!0,selector:{entity:{multiple:!0,integration:"sunspots",domain:"binary_sensor"}}},{name:"title",selector:{text:{}}}];return n==="timeline"?(r.push({name:"show_today",selector:{boolean:{}}},{name:"show_tomorrow",selector:{boolean:{}}},{name:"full_day",selector:{boolean:{}}}),t.full_day!==!0&&r.push({name:"start_hour",selector:F},{name:"end_hour",selector:F})):n==="map"&&r.push({name:"start_hour",selector:F},{name:"end_hour",selector:F}),r}function Ot(t,e){let n=[{name:"entity",required:!0,selector:{entity:{integration:"sunspots",domain:"binary_sensor"}}},{name:"title",selector:{text:{}}},{name:"theme",selector:{select:{mode:"dropdown",options:Ht(zn,e)}}},{name:"refresh_minutes",selector:{number:{min:1,max:60,step:1,mode:"box"}}},{name:"show_slider",selector:{boolean:{}}}];return t.show_slider===!0&&n.push({name:"start_hour",selector:F},{name:"end_hour",selector:F}),n}function Nt(t,e){let n=In[t];return n?h(e,n):t}function Ut(t,e,n){if(t==="start_hour"||t==="end_hour")return h(e,n==="timeline"?"editor_hours_helper_timeline":"editor_hours_helper_slider");let r=Fn[t];return r?h(e,r):""}var Wn="custom:sunspots-card",Yn="custom:sunspots-shadow-card",qn=["type","mode","entities","entity","title","show_today","show_tomorrow","full_day","start_hour","end_hour"],Vn=["type","entity","entities","title","theme","refresh_minutes","show_slider","start_hour","end_hour"];function je(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)?{...t}:{}}function ue(t){return(Array.isArray(t)?t:[t]).filter(n=>typeof n=="string"&&n!=="")}function Pt(t){let e=ue(t.entities);return e.length>0?e:ue(t.entity)}function O(t){let e=typeof t=="string"&&t.trim()!==""?Number(t):t;return typeof e=="number"&&Number.isFinite(e)?e:void 0}function le(t,e){let n=O(t);if(n===void 0)return;let r=Math.min(24,Math.max(0,Math.round(n)));return r===e?void 0:r}function z(t){return typeof t=="string"&&t.trim()!==""?t:void 0}function It(t,e,n,r){let o={};for(let i of t)e[i]!==void 0&&(o[i]=e[i]);for(let i of[r,n])for(let[s,a]of Object.entries(i))!t.includes(s)&&a!==void 0&&(o[s]=a);return o}function Ft(t){let{entity:e,...n}=t,r=K(t);return{...n,mode:r,entities:Pt(t),show_today:t.show_today!==!1,show_tomorrow:t.show_tomorrow!==!1,full_day:t.full_day===!0,...r==="map"?{start_hour:O(t.start_hour)??S[0],end_hour:O(t.end_hour)??S[1]}:{}}}function Kt(t,e={}){let n=K(t),[r,o]=ze[n],i=a=>typeof a=="number"?a:void 0,s={type:typeof t.type=="string"?t.type:z(e.type)??Wn,mode:n==="overview"?void 0:n,entities:Pt(t),title:z(t.title),show_today:t.show_today===!1?!1:void 0,show_tomorrow:t.show_tomorrow===!1?!1:void 0,full_day:t.full_day===!0?!0:void 0,start_hour:le(t.start_hour,i(r)),end_hour:le(t.end_hour,i(o))};return It(qn,s,t,e)}function zt(t){let{entities:e,...n}=t;return{...n,entity:z(t.entity)??ue(e)[0]??"",theme:t.theme??"auto",refresh_minutes:O(t.refresh_minutes)??5,show_slider:t.show_slider===!0,start_hour:O(t.start_hour)??S[0],end_hour:O(t.end_hour)??S[1]}}function jt(t,e={}){let n=O(t.refresh_minutes),r=n===void 0?void 0:Math.min(60,Math.max(1,Math.round(n))),o=t.theme,i={type:typeof t.type=="string"?t.type:z(e.type)??Yn,entity:z(t.entity)??ue(t.entities)[0]??"",title:z(t.title),theme:o==="light"||o==="dark"?o:void 0,refresh_minutes:r===5?void 0:r,show_slider:t.show_slider===!0?!0:void 0,start_hour:le(t.start_hour,S[0]),end_hour:le(t.end_hour,S[1])};return It(Vn,i,t,e)}function Bt(t){return new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0})}var Gn=["sunny","sunny_weather_aware","next_change","sun_remaining","sun_hours_today","sun_forecast","sun_tomorrow"];function Xn(t){return Gn.some(e=>e===t)}function Wt(t,e){let n=t.entities[e];if(!n?.device_id)return;let r={};for(let[o,i]of Object.entries(t.entities))!i||i.device_id!==n.device_id||i.platform!==n.platform||Xn(i.translation_key)&&r[i.translation_key]===void 0&&(r[i.translation_key]=o);return r.sunny=e,r}function ce(t,e){return(e.length>0?e:Object.keys(t.entities)).find(r=>{let o=t.entities[r];return r.startsWith("binary_sensor.")&&o?.platform==="sunspots"&&o.translation_key==="sunny"})}function Be(t){return!t||t.state==="unavailable"||t.state==="unknown"}function We(t,e){let n=t?.attributes[e];return typeof n=="string"&&n!==""?n:void 0}function Yt(t,e){let n=t?.attributes[e];return typeof n=="number"&&Number.isFinite(n)?n:void 0}function j(t,e,n){let r=t.map(([i,s])=>[Math.max(i,e),Math.min(s,n)]).filter(([i,s])=>s>i).sort((i,s)=>i[0]-s[0]),o=[];for(let[i,s]of r){let a=o[o.length-1];a&&i<=a[1]?a[1]=Math.max(a[1],s):o.push([i,s])}return o}function Zn(t,e,n){return(t-e)/(n-e)*100}function qt(t){let{windowStart:e,windowEnd:n,now:r}=t,o=j(t.geometry,e,n).map(([a,d])=>({start:a,end:d,kind:"sunny",past:d<=r})),i=[];for(let a of["unlikely","partly","sunny"]){let d=t.forecast.filter(u=>u.kind===a).map(u=>[u.start,u.end]);for(let[u,c]of j(d,e,n))i.push({start:u,end:c,kind:a,past:c<=r})}i.sort((a,d)=>a.start-d.start);let s=r>=e&&r<=n;return{geometry:o,forecast:i,nowPercent:s?Zn(r,e,n):void 0}}var me=1440,Jn=[6,22],Ye={today:0,tomorrow:me};function pe(t,e){let n=[];return t&&n.push("today"),e&&n.push("tomorrow"),n}function Vt(t){return t<=720?120:t<=1080?180:240}function Gt(t,e){return t.map(([n,r])=>[n+e,r+e])}function Qn(t){let e=j(t,0,me),n=e[0],r=e[e.length-1];return!n||!r?Jn:[Math.floor(n[0]/60),Math.ceil(r[1]/60)]}function Xt(t,e,n){let r=Qn(n),o=t==="auto"?r[0]:t,i=e==="auto"?r[1]:e;return i<=o&&(i=Math.min(24,o+1),o=i-1),[o,i]}var Zt=new Map;function Jt(t,e){let n=t??"en",r=`${n}|${e.minute??""}`,o=Zt.get(r);if(!o){try{o=new Intl.DateTimeFormat(n,{...e,timeZone:"UTC"})}catch{o=new Intl.DateTimeFormat("en",{...e,timeZone:"UTC"})}Zt.set(r,o)}return o}function Qt(t,e){let n=(Math.round(t)%1440+1440)%1440;return e.format(new Date(n*6e4))}function R(t,e){return Qt(t,Jt(e,{hour:"2-digit",minute:"2-digit"}))}function en(t,e){return Qt(t,Jt(e,{hour:"numeric"}))}function ee(t,e){return new Intl.NumberFormat(e??"en",{maximumFractionDigits:1}).format(t)}function qe(t,e){let n=R(t,e);return t>=1440?`${h(e,"tomorrow")} ${n}`:n}function Ve(t,e,n){return h(n,t,{time:qe(e,n)})}function Ge(t,e){return`${ee(t,e)}°`}var er=90,tr=18;function he(t,e,n){return`${R(t,n)}–${R(e,n)}`}function tn(t,e,n,r){if(t.kind!=="sunny")return;let o=t.end-t.start,i=o/(n-e)*100;if(!(o<er||i<tr))return he(t.start,t.end,r)}function nr(t){return t.reduce((e,[n,r])=>e+(r-n),0)}function nn(t,e,n){let r=j(t,0,me);return r.length===0?h(n,"no_direct_sun"):h(n,e?"partly_summary":"sun_summary",{ranges:r.map(([o,i])=>he(o,i,n)).join(", "),hours:h(n,"hours_short",{hours:ee(nr(r)/60,n)})})}function rn(t,e,n){return e===void 0?t:`${t} · ${h(n,"first_sun",{time:R(e,n)})}`}var on=new Map;function rr(t){let e=on.get(t);return e||(e=new Intl.DateTimeFormat("en-US",{timeZone:t,hourCycle:"h23",year:"numeric",month:"numeric",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric"}),on.set(t,e)),e}function Xe(t,e){let n={};for(let r of rr(e).formatToParts(t))r.type!=="literal"&&(n[r.type]=Number(r.value));return Date.UTC(n.year??1970,(n.month??1)-1,n.day??1,(n.hour??0)%24,n.minute??0,n.second??0)}function Ze(t,e){return Math.floor(Xe(t,e)/864e5)*864e5}var or=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;function fe(t,e,n){if(typeof t!="string")return;let r=or.exec(t.trim());if(!r)return;let o;if(r[7]===void 0)o=Date.UTC(Number(r[1]),Number(r[2])-1,Number(r[3]),Number(r[4]),Number(r[5]),Number(r[6]??0));else{let i=new Date(t.trim());if(Number.isNaN(i.getTime()))return;o=Xe(i,e)}if(!Number.isNaN(o))return(o-n)/6e4}function ge(t,e){return new Date(e+Math.round(t)*6e4).toISOString().slice(0,19)}function sn(t,e){return(Xe(t,e)-Ze(t,e))/6e4}var Je=10,ir=[0,24],et={sunny:"mdi:white-balance-sunny",shaded:"mdi:weather-sunny-off",sunny_cloudy:"mdi:weather-partly-cloudy",unavailable:"mdi:help-circle-outline"},un={sunny:"legend_sunny",partly:"legend_partly",unlikely:"legend_unlikely",geometry:"legend_geometry"};function E(t){return t.locale?.language??t.language??"en"}function nt(t,e){let n=We(t,"friendly_name");if(!n)return e;let r=n.replace(/\s+(sunny|sonnig)$/i,"").trim();return r===""?n:r}function ln(t,e){let n=t.config.time_zone;return{hass:t,language:E(t),tz:n,dayStart:Ze(e,n),now:sn(e,n)}}function U(t,e){return fe(e,t.tz,t.dayStart)}function Qe(t,e){if(!Array.isArray(e))return[];let n=[];for(let r of e){let[o,i]=Array.isArray(r)?[r[0],r[1]]:typeof r=="object"&&r!==null?[r.start,r.end]:[void 0,void 0],s=U(t,o),a=U(t,i);s!==void 0&&a!==void 0&&n.push([s,a])}return n}function an(t,e){let n=e?.attributes.windows;if(!Array.isArray(n))return[];let r=[];for(let o of n){if(typeof o!="object"||o===null)continue;let i=o,s=U(t,i.start),a=U(t,i.end),d=i.class;s===void 0||a===void 0||d!=="sunny"&&d!=="partly"&&d!=="unlikely"||r.push({start:s,end:a,kind:d,past:i.past===!0})}return r}function N(t,e){return e===void 0?void 0:t.hass.states[e]}function sr(t,e){return Be(t)?"unavailable":t?.state!=="on"?"shaded":e&&!Be(e)&&e.state==="off"?"sunny_cloudy":"sunny"}function cn(t,e,n){let r=N(t,e.sunny_weather_aware),o=sr(n,r);return{aware:r,status:o,statusLabel:h(t.language,o),icon:et[o]}}function ar(t,e,n){let r=t.hass.states[n],{aware:o,status:i,statusLabel:s,icon:a}=cn(t,e,r),d=(y,w)=>h(t.language,y,w),u={entityId:n,name:nt(r,n),status:i,statusLabel:s,icon:a,extras:[]},c=U(t,N(t,e.next_change)?.state);c!==void 0&&i!=="unavailable"&&(u.boundary=Ve(r?.state==="on"?"until":"from",c,t.language));let l=N(t,e.sun_forecast);if(l?.state==="sunny_later"||l?.state==="partly_later"){let y=l.attributes.best_window,w=typeof y=="object"&&y!==null?U(t,y.start):void 0;w!==void 0&&(u.forecastNote=Ve(l.state==="sunny_later"?"sun_expected_from":"partly_expected_from",w,t.language))}else l?.state==="no_sun_today"&&(u.forecastNote=d("no_sun_today"));let f=Number(N(t,e.sun_hours_today)?.state);N(t,e.sun_hours_today)&&Number.isFinite(f)&&u.extras.push(d("sun_hours_today",{hours:ee(f,t.language)}));let g=Yt(o,"cloud_coverage");return g!==void 0&&i!=="shaded"&&i!=="unavailable"&&u.extras.push(d("cloud_coverage",{percent:Math.round(g)})),u}function dr(t,e,n){let r=[],o=Vt(n-e);for(let i=Math.ceil(e/60)*60;i<=n;i+=60){let s=(i-e)/(n-e)*100;r.push(i%o===0?{percent:s,label:en(i,t.language)}:{percent:s})}return r}function ur(t,e,n,r){if(r==="today")return{geometry:Qe(t,n?.attributes.intervals_today),windows:an(t,N(t,e.sun_forecast)),firstSun:void 0};let o=Ye.tomorrow,i=N(t,e.sun_tomorrow),s=n?.attributes.intervals_tomorrow,a=Array.isArray(s)?Qe(t,s):Qe(t,i?.attributes.intervals),d=U(t,i?.state);return{geometry:Gt(a,-o),windows:an(t,i).map(u=>({...u,start:u.start-o,end:u.end-o})),firstSun:d===void 0?void 0:d-o}}function lr(t,e,n,r,o,i){let s=(b,x)=>h(t.language,b,x),a=t.language,d=n.windows.length>0,u=qt({geometry:n.geometry,forecast:n.windows,windowStart:r,windowEnd:o,now:t.now-Ye[e]}),c=d?u.forecast:u.geometry,l=o-r,f=c.map(b=>{let x=tn(b,r,o,a);return{left:(b.start-r)/l*100,width:(b.end-b.start)/l*100,kind:b.kind,past:b.past,...x?{label:x}:{}}}),g=b=>s(un[b]),y=c.map(b=>`${g(d?b.kind:"geometry")} ${he(b.start,b.end,a)}`),w=b=>n.windows.filter(x=>x.kind===b).map(x=>[x.start,x.end]),L=d?w("sunny"):n.geometry,_=d&&L.length===0,A=nn(_?w("partly"):L,_,a),dt=s(e==="today"?"day_today":"day_tomorrow");return{key:e,label:dt,bars:f,nowPercent:e==="today"?u.nowPercent:void 0,usesForecast:d,summary:e==="tomorrow"?rn(A,n.firstSun,a):A,ariaLabel:s("timeline_bar_alt",{name:i,day:dt,summary:y.length>0?y.join("; "):s("timeline_none")})}}function cr(t,e,n,r){let o=t.hass.states[n],i=nt(o,n),s=pe(r.showToday,r.showTomorrow).map(_=>({key:_,data:ur(t,e,o,_)})),a=s.flatMap(({data:_})=>[..._.geometry,..._.windows.map(A=>[A.start,A.end])]),[d,u]=r.fullDay?ir:Xt(r.startHour,r.endHour,a),c=d*60,l=u*60,f=s.map(({key:_,data:A})=>lr(t,_,A,c,l,i)),g=[];f.some(_=>_.usesForecast)&&g.push("sunny","partly","unlikely"),f.some(_=>!_.usesForecast&&_.bars.length>0)&&g.push("geometry");let{status:y,statusLabel:w,icon:L}=cn(t,e,o);return{entityId:n,name:i,status:y,statusLabel:w,icon:L,days:f,ticks:dr(t,c,l),legend:g.map(_=>({kind:_,label:h(t.language,un[_])})),nowLabel:h(t.language,"now")}}function tt(t,e,n){return{entityId:e,name:e,error:h(t.language,"entity_missing",{entity:e}),...n}}function dn(t,e){return typeof t=="number"?t:e}function mn(t,e,n,r,o){let i=t.hass.states[n],s=r*60,a=o*60,d=Math.round(t.now/Je)*Je,u={minMinute:s,maxMinute:a,step:Je,initialMinute:Math.min(a,Math.max(s,d)),dayStart:t.dayStart};if(!i||!e)return tt(t,n,u);let c=We(i,"attribution");return{entityId:n,name:nt(i,n),...u,...c?{attribution:c}:{}}}function _e(t,e){return t.states[e]?Wt(t,e):void 0}function ye(t,e,n){let r=ln(t,n);return{title:e.title??h(r.language,"default_title"),map:mn(r,_e(t,e.entity),e.entity,e.startHour,e.endHour)}}function rt(t,e,n){let r=ln(t,n),o=e.title??h(r.language,"default_title");if(e.mode==="map"){let s=e.entities[0],a=dn(e.startHour,S[0]),d=dn(e.endHour,S[1]);return{mode:"map",title:o,map:mn(r,_e(t,s),s,a,d)}}if(e.mode==="timeline"){let s=e.entities.map(a=>{let d=_e(t,a);return d?cr(r,d,a,e):tt(r,a,{status:"unavailable",statusLabel:"",icon:et.unavailable,days:[],ticks:[],legend:[],nowLabel:""})});return{mode:"timeline",title:o,rows:s}}let i=e.entities.map(s=>{let a=_e(t,s);return a?ar(r,a,s):tt(r,s,{status:"unavailable",statusLabel:"",icon:et.unavailable,extras:[]})});return{mode:"overview",title:o,rows:i}}var B=class extends v{static{this.properties={hass:{attribute:!1},_config:{state:!0}}}constructor(){super(),this._config={}}setConfig(e){this._config=je(e)}onChange(e){e.stopPropagation(),this._config=this.spec.normalize(je(e.detail.value),this._config),this.dispatchEvent(Bt(this._config))}render(){if(!this.hass)return m;let e=E(this.hass),n=this.spec.hourScope(this._config);return p`<ha-form
      .hass=${this.hass}
      .data=${this.spec.formData(this._config)}
      .schema=${this.spec.schema(this._config,e)}
      .computeLabel=${r=>Nt(r.name,e)}
      .computeHelper=${r=>Ut(r.name,e,n)}
      @value-changed=${r=>this.onChange(r)}
    ></ha-form>`}};function te(t,e,n){return t.get(e)!==void 0?!1:(t.define(e,n),!0)}function be(t,e,n,r){te(customElements,t,e)&&(window.customCards=window.customCards??[],window.customCards.push({type:t,name:h(navigator.language,n),description:h(navigator.language,r)}))}var mr={schema:Dt,hourScope:t=>K(t)==="timeline"?"timeline":"slider",formData:Ft,normalize:Kt},ot=class extends B{constructor(){super(...arguments);this.spec=mr}};te(customElements,"sunspots-card-editor",ot);function pr(t,e=307200){return typeof t!="string"||t.length===0?{ok:!1,reason:"invalid"}:t.length>e?{ok:!1,reason:"too_large"}:t.length*3>e&&new TextEncoder().encode(t).length>e?{ok:!1,reason:"too_large"}:{ok:!0,svg:t}}function pn(t){return typeof t=="number"&&Number.isFinite(t)?t:void 0}function hn(t,e){let r=t?.response?.[e];if(typeof r!="object"||r===null)return{ok:!1,reason:"invalid"};let o=r,i=pr(o.svg);return i.ok?{ok:!0,map:{svg:i.svg,time:typeof o.time=="string"?o.time:void 0,sunAzimuth:pn(o.sun_azimuth),sunElevation:pn(o.sun_elevation),sunBelowHorizon:o.sun_below_horizon===!0}}:i}function fn(t,e,n){return{type:"call_service",domain:"sunspots",service:"render_shadow_map",service_data:e===void 0?{theme:n}:{time:e,theme:n},target:{entity_id:t},return_response:!0}}function gn(t){if(typeof t=="string")return t;if(typeof t=="object"&&t!==null&&"message"in t){let e=t.message;if(typeof e=="string"&&e!=="")return e}return"unknown error"}var we=class extends Error{constructor(n){super(n);this.reason=n}},W=class{constructor(e,n){this.getHass=e;this.onChange=n;this.current={status:"idle"}}get state(){return this.current}request(e){let n=this.current;this.setState(n.status==="ready"||n.status==="loading"?{status:"loading",...n.url?{url:n.url}:{},...n.map?{map:n.map}:{}}:{status:"loading"}),this.runner??=new se(r=>this.fetch(r),r=>this.settled(r)),this.runner.request(e)}reset(){this.runner?.dispose(),this.runner=void 0,this.revoke(),this.setState({status:"idle"})}setState(e){this.current=e,this.onChange(e)}revoke(){this.objectUrl&&URL.revokeObjectURL(this.objectUrl),this.objectUrl=void 0}async fetch(e){let n=this.getHass();if(!n)throw new Error("not ready");let r=await n.connection.sendMessagePromise(fn(e.entityId,e.isoTime,e.theme)),o=hn(r,e.entityId);if(!o.ok)throw new we(o.reason);return o.map}settled(e){if(this.revoke(),!e.ok){let n=this.getHass(),r=n?E(n):void 0,o=e.error,i=o instanceof we?h(r,o.reason==="too_large"?"map_too_large":"map_invalid"):h(r,"map_error",{message:gn(o)});this.setState({status:"error",message:i});return}this.objectUrl=URL.createObjectURL(new Blob([e.value.svg],{type:"image/svg+xml"})),this.setState({status:"ready",url:this.objectUrl,map:e.value})}};function _n(t){return(e,n)=>h(t,e,n)}function ve(t,e,n,r,o){let i=t.status==="ready"||t.status==="loading"?t.map:void 0;if(!i?.time)return R(o,r);let s=fe(i.time,n.config.time_zone,e.dayStart);return s!==void 0?qe(s,r):i.time}function Se(t,e,n,r){let o=_n(r),i=t.status==="ready"||t.status==="loading"?t.url:void 0;return p`<div class="mapbox" aria-busy=${t.status==="loading"?"true":"false"}>
    ${i?p`<img src=${i} alt=${o("map_alt",{name:e.name,time:n})} />`:m}
    ${t.status==="loading"?p`<div class="overlay" role="status">${o("map_loading")}</div>`:m}
    ${t.status==="error"?p`<div class="error" role="alert">${t.message}</div>`:m}
  </div>`}function xe(t,e,n,r){let o=R(e,n);return p`<label class="slider">
    <span>${t.name} · <strong>${o}</strong></span>
    <input
      type="range"
      .min=${String(t.minMinute)}
      .max=${String(t.maxMinute)}
      .step=${String(t.step)}
      .value=${String(e)}
      aria-valuetext=${o}
      @input=${r}
    />
  </label>`}function $e(t,e,n,r){let o=_n(r),i=t.status==="ready"||t.status==="loading"?t.map:void 0;return p`${i?p`<div class="meta">
        <div>${o("map_time",{time:n})}</div>
        ${i.sunAzimuth!==void 0&&i.sunElevation!==void 0?p`<div>
              ${o("azimuth")}: ${Ge(i.sunAzimuth,r)} · ${o("elevation")}:
              ${Ge(i.sunElevation,r)}
            </div>`:m}
        ${i.sunBelowHorizon?p`<div>${o("map_sun_below")}</div>`:m}
      </div>`:m}
  ${e.attribution?p`<div class="attribution">${e.attribution}</div>`:m}`}var Ee=M`
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
`;function Y(t,e){return t==="auto"?e.themes?.darkMode===!0?"dark":"light":t}var hr=150,it=class extends v{constructor(){super();this.loader=new W(()=>this.hass,n=>{this._mapState=n});this.debouncer=ae(()=>this.loadMap(),hr);this.dayStart=0;this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(n,r){let o=ce(n,r);return{type:"custom:sunspots-card",mode:"overview",entities:o?[o]:[]}}static getConfigElement(){return document.createElement("sunspots-card-editor")}setConfig(n){this._config=kt(n),this.resetMap()}getCardSize(){let n=this._config;return n?n.mode==="map"?8:n.mode==="timeline"?1+n.entities.length*(1+pe(n.showToday,n.showTomorrow).length*2):1+n.entities.length:1}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}disconnectedCallback(){super.disconnectedCallback(),this.resetMap()}updated(){let n=this._config,r=this.hass,o=n?.entities[0];if(!r||n?.mode!=="map"||!o)return;let i=`${o}|${Y("auto",r)}`;if(this.mapKey===i)return;let s=this.currentModel();s?.mode==="map"&&!s.map.error&&(this.mapKey=i,this.mapEntity=o,this.dayStart=s.map.dayStart,this._minute??=s.map.initialMinute,this.loadMap())}currentModel(){return this.hass&&this._config?rt(this.hass,this._config,new Date):void 0}loadMap(){let n=this.hass,r=this.mapEntity;!n||!r||this._minute===void 0||this.loader.request({entityId:r,isoTime:ge(this._minute,this.dayStart),theme:Y("auto",n)})}resetMap(){this.debouncer.cancel(),this.loader.reset(),this.mapKey=void 0,this.mapEntity=void 0,this._minute=void 0}onSlide(n){this._minute=Number(n.target.value),this.debouncer.call()}render(){if(!this._config||!this.hass)return p`<ha-card></ha-card>`;let n=rt(this.hass,this._config,new Date),r=E(this.hass);return p`<ha-card .header=${n.title}>
      <div class="content">
        ${n.mode==="overview"?n.rows.map(o=>this.renderOverviewRow(o)):n.mode==="timeline"?this.renderTimeline(n.rows):this.renderMap(n.map,this.hass,r)}
      </div>
    </ha-card>`}renderOverviewRow(n){if(n.error)return p`<div class="row error">${n.error}</div>`;let r=[n.boundary,n.forecastNote,...n.extras].filter(o=>!!o);return p`<div class="row">
      <div class="name">${n.name}</div>
      <div class="chip ${n.status}">
        <ha-icon icon=${n.icon}></ha-icon><span>${n.statusLabel}</span>
      </div>
      ${r.length>0?p`<div class="details">${r.join(" · ")}</div>`:m}
    </div>`}renderTimeline(n){return n.map(r=>r.error?p`<div class="row error">${r.error}</div>`:p`<div class="timeline">
        <div class="head">
          <div class="name">${r.name}</div>
          <div class="chip ${r.status}">
            <ha-icon icon=${r.icon}></ha-icon><span>${r.statusLabel}</span>
          </div>
        </div>
        ${r.days.map(o=>this.renderDay(r,o))}
        <ul class="legend">
          ${r.legend.map(o=>p`<li><span class="swatch seg ${o.kind==="geometry"?"sunny":o.kind}"></span>${o.label}</li>`)}
        </ul>
      </div>`)}renderDay(n,r){return p`<div class="day ${r.key}">
      <div class="daylabel">${r.label}</div>
      <div class="daybody">
        <div class="barwrap">
          <div class="bar" role="img" aria-label=${r.ariaLabel}>
            ${n.ticks.map(o=>p`<div class="grid" style="left:${o.percent}%"></div>`)}
            ${r.bars.map(o=>p`<div
                class="seg ${o.kind} ${o.past?"past":""}"
                style="left:${o.left}%;width:${o.width}%"
              >
                ${o.label?p`<span class="seglabel">${o.label}</span>`:m}
              </div>`)}
          </div>
          ${r.nowPercent!==void 0?p`<div class="now" style="left:${r.nowPercent}%"></div>
                <div class="nowlabel" style="left:${r.nowPercent}%" aria-hidden="true">${n.nowLabel}</div>`:m}
        </div>
        <div class="ticks" aria-hidden="true">
          ${n.ticks.map(o=>o.label?p`<span style="left:${o.percent}%">${o.label}</span>`:m)}
        </div>
        <div class="summary">${r.summary}</div>
      </div>
    </div>`}renderMap(n,r,o){if(n.error)return p`<div class="row error">${n.error}</div>`;let i=this._mapState,s=this._minute??n.initialMinute,a=ve(i,n,r,o,s);return p`${Se(i,n,a,o)}
    ${xe(n,s,o,d=>this.onSlide(d))}
    ${$e(i,n,a,o)}`}static{this.styles=[Ee,M`
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
    `]}};be("sunspots-card",it,"card_name","card_description");var fr={schema:Ot,hourScope:()=>"slider",formData:zt,normalize:jt},st=class extends B{constructor(){super(...arguments);this.spec=fr}};te(customElements,"sunspots-shadow-card-editor",st);var gr=150,at=class extends v{constructor(){super();this.loader=new W(()=>this.hass,n=>{this._mapState=n});this.debouncer=ae(()=>this.load(),gr);this._mapState={status:"idle"}}static{this.properties={hass:{attribute:!1},_config:{state:!0},_mapState:{state:!0},_minute:{state:!0}}}static getStubConfig(n,r){return{type:"custom:sunspots-shadow-card",entity:ce(n,r)??""}}static getConfigElement(){return document.createElement("sunspots-shadow-card-editor")}setConfig(n){this._config=Tt(n),this.stop(),this.loader.reset(),this._minute=void 0,this.loadedKey=void 0,this.isConnected&&this.arm()}getCardSize(){return this._config?.showSlider?8:6}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}connectedCallback(){super.connectedCallback(),this.arm(),this.requestUpdate()}disconnectedCallback(){super.disconnectedCallback(),this.stop(),this.loader.reset(),this.loadedKey=void 0}updated(){let n=this._config,r=this.hass;if(!n||!r||!this.isConnected)return;let o=`${n.entity}|${Y(n.theme,r)}`;if(this.loadedKey===o)return;let{map:i}=ye(r,n,new Date);i.error||(this.loadedKey=o,this.load())}arm(){this.stop();let n=this._config?.refreshMinutes;n!==void 0&&(this.timer=setInterval(()=>this.load(),n*6e4))}stop(){this.debouncer.cancel(),this.timer!==void 0&&clearInterval(this.timer),this.timer=void 0}load(){let n=this._config,r=this.hass;if(!n||!r)return;let{dayStart:o}=ye(r,n,new Date).map;this.loader.request({entityId:n.entity,isoTime:this._minute===void 0?void 0:ge(this._minute,o),theme:Y(n.theme,r)})}onRefresh(){this._minute=void 0,this.load()}onSlide(n){this._minute=Number(n.target.value),this.debouncer.call()}render(){let n=this._config,r=this.hass;if(!n||!r)return p`<ha-card></ha-card>`;let{title:o,map:i}=ye(r,n,new Date),s=E(r);if(i.error)return p`<ha-card .header=${o}><div class="content error">${i.error}</div></ha-card>`;let a=this._mapState,d=this._minute??i.initialMinute,u=ve(a,i,r,s,d);return p`<ha-card .header=${o}>
      <div class="content">
        ${Se(a,i,u,s)}
        ${n.showSlider?xe(i,d,s,c=>this.onSlide(c)):m}
        <div class="footer">
          <div class="caption">${$e(a,i,u,s)}</div>
          <button
            class="refresh"
            type="button"
            title=${h(s,"refresh")}
            aria-label=${h(s,"refresh")}
            @click=${()=>this.onRefresh()}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
          </button>
        </div>
      </div>
    </ha-card>`}static{this.styles=[Ee,M`
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
    `]}};be("sunspots-shadow-card",at,"shadow_card_name","shadow_card_description");
