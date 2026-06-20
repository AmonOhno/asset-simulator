import{n as e}from"./chunk-DnJy8xQt.js";import{t}from"./jsx-runtime-CXZ2plg1.js";function n({label:e,sizeVariant:t=`M`,colorVariant:n=`primary`,icon:s,onClick:c}){return(0,r.jsxs)(`button`,{type:`button`,style:{...o,...a[n],width:i[t]},onClick:c,children:[s&&(0,r.jsx)(`span`,{"aria-hidden":`true`,children:s}),e]})}var r,i,a,o,s=e((()=>{r=t(),i={S:`80px`,M:`120px`,L:`160px`,LL:`200px`,Full:`100%`},a={primary:{backgroundColor:`#4F46E5`,color:`#FFFFFF`,border:`none`},secondary:{backgroundColor:`#FFFFFF`,color:`#4F46E5`,border:`1.5px solid #4F46E5`}},o={height:48,fontSize:16,fontWeight:700,borderRadius:8,cursor:`pointer`,display:`inline-flex`,alignItems:`center`,justifyContent:`center`,gap:8,boxSizing:`border-box`,transition:`opacity 0.15s ease`},n.__docgenInfo={description:``,methods:[],displayName:`CommonButton`,props:{label:{required:!0,tsType:{name:`string`},description:``},sizeVariant:{required:!1,tsType:{name:`union`,raw:`"S" | "M" | "L" | "LL" | "Full"`,elements:[{name:`literal`,value:`"S"`},{name:`literal`,value:`"M"`},{name:`literal`,value:`"L"`},{name:`literal`,value:`"LL"`},{name:`literal`,value:`"Full"`}]},description:``,defaultValue:{value:`"M"`,computed:!1}},colorVariant:{required:!1,tsType:{name:`union`,raw:`"primary" | "secondary"`,elements:[{name:`literal`,value:`"primary"`},{name:`literal`,value:`"secondary"`}]},description:``,defaultValue:{value:`"primary"`,computed:!1}},icon:{required:!1,tsType:{name:`string`},description:``},onClick:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``}}}})),c,l,u,d,f,p,m,h,g,_;e((()=>{s(),c=t(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`Components/CommonButton`,component:n,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{sizeVariant:{control:`select`,options:[`S`,`M`,`L`,`Full`]},colorVariant:{control:`select`,options:[`primary`,`secondary`]}},args:{onClick:l()}},d={args:{label:`保存する`,sizeVariant:`M`,colorVariant:`primary`}},f={args:{label:`キャンセル`,sizeVariant:`M`,colorVariant:`secondary`}},p={args:{label:`追加`,sizeVariant:`S`,colorVariant:`primary`}},m={args:{label:`シミュレーション実行`,sizeVariant:`L`,colorVariant:`primary`}},h={args:{label:`ログイン`,sizeVariant:`Full`,colorVariant:`primary`},decorators:[e=>(0,c.jsx)(`div`,{style:{width:358},children:(0,c.jsx)(e,{})})]},g={args:{label:`追加`,sizeVariant:`M`,colorVariant:`primary`,icon:`＋`}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    label: "保存する",
    sizeVariant: "M",
    colorVariant: "primary"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    label: "キャンセル",
    sizeVariant: "M",
    colorVariant: "secondary"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    label: "追加",
    sizeVariant: "S",
    colorVariant: "primary"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    label: "シミュレーション実行",
    sizeVariant: "L",
    colorVariant: "primary"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    label: "ログイン",
    sizeVariant: "Full",
    colorVariant: "primary"
  },
  decorators: [Story => <div style={{
    width: 358
  }}>
        <Story />
      </div>]
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    label: "追加",
    sizeVariant: "M",
    colorVariant: "primary",
    icon: "＋"
  }
}`,...g.parameters?.docs?.source}}},_=[`Primary`,`Secondary`,`Small`,`Large`,`FullWidth`,`WithIcon`]}))();export{h as FullWidth,m as Large,d as Primary,f as Secondary,p as Small,g as WithIcon,_ as __namedExportsOrder,u as default};