import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{O as n}from"./iframe-C-OuKDg-.js";import{t as r}from"./jsx-runtime-CXZ2plg1.js";function i({value:e,unit:t,min:n,max:r,error:i,onBlur:l,sizeVariant:u=`Full`}){let[d,f]=(0,a.useState)(String(e)),p=()=>{let t=parseFloat(d);isNaN(t)&&(t=e),n!=null&&t<n&&(t=n),r!=null&&t>r&&(t=r),f(String(t)),l?.(t)};return(0,o.jsxs)(`div`,{style:{...c.wrapper,width:s[u]},children:[(0,o.jsxs)(`div`,{style:c.inputRow,children:[(0,o.jsx)(`input`,{type:`text`,inputMode:`decimal`,value:d,onChange:e=>f(e.target.value),onBlur:p,style:{...c.input,...i?c.inputError:{}}}),t&&(0,o.jsx)(`span`,{style:c.unit,children:t})]}),i&&(0,o.jsx)(`p`,{style:c.errorText,children:i})]})}var a,o,s,c,l=t((()=>{a=e(n(),1),o=r(),s={S:`120px`,M:`160px`,L:`240px`,Full:`100%`},c={wrapper:{display:`flex`,flexDirection:`column`,gap:4,width:`100%`},inputRow:{display:`flex`,alignItems:`center`,gap:8},input:{height:44,fontSize:16,padding:`0 12px`,borderRadius:8,border:`1px solid #D1D5DB`,boxSizing:`border-box`,textAlign:`right`,flex:1,color:`#333`,backgroundColor:`#FFFFFF`,width:`100%`,minWidth:0},inputError:{borderColor:`#DC2626`},unit:{fontSize:14,color:`#666`,whiteSpace:`nowrap`},errorText:{fontSize:12,color:`#DC2626`,margin:0}},i.__docgenInfo={description:``,methods:[],displayName:`NumericInput`,props:{value:{required:!0,tsType:{name:`number`},description:``},unit:{required:!1,tsType:{name:`string`},description:``},min:{required:!1,tsType:{name:`number`},description:``},max:{required:!1,tsType:{name:`number`},description:``},error:{required:!1,tsType:{name:`string`},description:``},onBlur:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(value: number) => void`,signature:{arguments:[{type:{name:`number`},name:`value`}],return:{name:`void`}}},description:``},sizeVariant:{required:!1,tsType:{name:`union`,raw:`"S" | "M" | "L" | "Full"`,elements:[{name:`literal`,value:`"S"`},{name:`literal`,value:`"M"`},{name:`literal`,value:`"L"`},{name:`literal`,value:`"Full"`}]},description:``,defaultValue:{value:`"Full"`,computed:!1}}}}})),u,d,f,p,m,h,g,_,v,y,b;t((()=>{u=e(n(),1),l(),d=r(),f={title:`Components/NumericInput`,component:i,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{unit:{control:`text`},min:{control:`number`},max:{control:`number`},error:{control:`text`},sizeVariant:{control:`select`,options:[`S`,`M`,`L`,`Full`]}}},p={args:{value:1e6,unit:`円`,sizeVariant:`Full`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(i,{...e,value:t,onBlur:n})}},m={args:{value:3.5,unit:`%`,min:0,max:100},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(i,{...e,value:t,onBlur:n})}},h={args:{value:10,unit:`年`,min:1,max:50},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(i,{...e,value:t,onBlur:n})}},g={args:{value:10,unit:`年`,min:1,max:50,sizeVariant:`S`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(i,{...e,value:t,onBlur:n})}},_={args:{value:3.5,unit:`%`,min:0,max:100,sizeVariant:`M`},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(i,{...e,value:t,onBlur:n})}},v={args:{value:-100,unit:`円`,min:0,error:`0以上の値を入力してください`}},y={args:{value:50,unit:`%`,min:0,max:100},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,d.jsx)(i,{...e,value:t,onBlur:n})}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    value: 1000000,
    unit: "円",
    sizeVariant: "Full"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    value: 3.5,
    unit: "%",
    min: 0,
    max: 100
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    value: 10,
    unit: "年",
    min: 1,
    max: 50
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    value: 10,
    unit: "年",
    min: 1,
    max: 50,
    sizeVariant: "S"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    value: 3.5,
    unit: "%",
    min: 0,
    max: 100,
    sizeVariant: "M"
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    value: -100,
    unit: "円",
    min: 0,
    error: "0以上の値を入力してください"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    value: 50,
    unit: "%",
    min: 0,
    max: 100
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  }
}`,...y.parameters?.docs?.source}}},b=[`Default`,`WithPercentage`,`WithYears`,`SizeSmall`,`SizeMedium`,`WithError`,`WithMinMax`]}))();export{p as Default,_ as SizeMedium,g as SizeSmall,v as WithError,y as WithMinMax,m as WithPercentage,h as WithYears,b as __namedExportsOrder,f as default};