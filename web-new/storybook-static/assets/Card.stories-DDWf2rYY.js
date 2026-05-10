import{a as e,n as t}from"./chunk-DnJy8xQt.js";import{O as n}from"./iframe-C-OuKDg-.js";import{t as r}from"./jsx-runtime-CXZ2plg1.js";function i({children:e}){return(0,s.jsx)(`div`,{children:e})}function a({children:e}){return(0,s.jsx)(`div`,{children:e})}function o({isExpanded:e,onToggle:t,title:n,subInfo:r,maxHeight:i,children:a}){let o={...c.container,...i==null?{}:{maxHeight:i}},l={...c.body,...typeof i==`number`?{overflowY:`auto`,flex:1}:{}};return e?(0,s.jsxs)(`div`,{style:o,children:[(0,s.jsxs)(`div`,{style:c.header,onClick:t,role:`button`,tabIndex:0,onKeyDown:e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),t())},"aria-expanded":e,children:[(0,s.jsx)(`span`,{style:c.headerTitle,children:n}),(0,s.jsxs)(`span`,{children:[r&&(0,s.jsx)(`span`,{style:c.headerSubInfo,children:r}),(0,s.jsx)(`span`,{style:{...c.chevron,transform:e?`rotate(180deg)`:`rotate(0deg)`},children:`▼`})]})]}),(0,s.jsx)(`div`,{style:l,children:a})]}):(0,s.jsx)(`div`,{style:o,children:(0,s.jsxs)(`div`,{style:c.header,onClick:t,role:`button`,tabIndex:0,onKeyDown:e=>{(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),t())},"aria-expanded":e,children:[(0,s.jsx)(`span`,{style:c.headerTitle,children:n}),(0,s.jsxs)(`span`,{children:[r&&(0,s.jsx)(`span`,{style:c.headerSubInfo,children:r}),(0,s.jsx)(`span`,{style:{...c.chevron,transform:e?`rotate(180deg)`:`rotate(0deg)`},children:`▼`})]})]})})}var s,c,l=t((()=>{n(),s=r(),c={container:{width:358,borderRadius:12,background:`#FFFFFF`,boxShadow:`0px 4px 12px rgba(0,0,0,0.08)`,boxSizing:`border-box`,overflow:`hidden`},header:{height:32,display:`flex`,flexDirection:`row`,alignItems:`center`,justifyContent:`space-between`,padding:`0 12px`,cursor:`pointer`,userSelect:`none`},headerTitle:{fontSize:14,fontWeight:600,color:`#333`,margin:0},headerSubInfo:{fontSize:13,color:`#888`,margin:0},chevron:{fontSize:12,color:`#888`,marginLeft:8,transition:`transform 0.2s ease`},body:{padding:20,display:`flex`,flexDirection:`column`,gap:10}},i.__docgenInfo={description:``,methods:[],displayName:`CardBodyHead`,props:{children:{required:!1,tsType:{name:`ReactNode`},description:``}}},a.__docgenInfo={description:``,methods:[],displayName:`CardBodyMain`,props:{children:{required:!1,tsType:{name:`ReactNode`},description:``}}},o.__docgenInfo={description:``,methods:[],displayName:`Card`,props:{isExpanded:{required:!0,tsType:{name:`boolean`},description:``},onToggle:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},title:{required:!0,tsType:{name:`string`},description:``},subInfo:{required:!1,tsType:{name:`string`},description:``},maxHeight:{required:!1,tsType:{name:`union`,raw:`string | number`,elements:[{name:`string`},{name:`number`}]},description:``},children:{required:!1,tsType:{name:`ReactNode`},description:``}}}})),u,d,f,p,m,h,g;t((()=>{u=e(n(),1),l(),d=r(),f={title:`Components/Card`,component:o,parameters:{layout:`centered`},tags:[`autodocs`],argTypes:{isExpanded:{control:`boolean`},title:{control:`text`},subInfo:{control:`text`},maxHeight:{control:`text`}}},p={args:{isExpanded:!0,title:`資産シミュレーション`,subInfo:`概要`,onToggle:()=>{}},render:function(e){let[t,n]=(0,u.useState)(e.isExpanded);return(0,d.jsxs)(o,{...e,isExpanded:t,onToggle:()=>n(!t),children:[(0,d.jsx)(i,{children:(0,d.jsx)(`p`,{style:{margin:0,color:`#666`},children:`合計: ¥1,000,000`})}),(0,d.jsx)(a,{children:(0,d.jsx)(`p`,{style:{margin:0},children:`ここにフォームなどのコンテンツが入ります。`})})]})}},m={args:{isExpanded:!1,title:`投資設定`,subInfo:`3件`,onToggle:()=>{}}},h={args:{isExpanded:!0,title:`スクロール表示`,subInfo:``,maxHeight:200,onToggle:()=>{}},render:function(e){let[t,n]=(0,u.useState)(!0);return(0,d.jsx)(o,{...e,isExpanded:t,onToggle:()=>n(!t),children:(0,d.jsx)(a,{children:Array.from({length:10},(e,t)=>(0,d.jsxs)(`p`,{style:{margin:`8px 0`},children:[`コンテンツ行 `,t+1]},t))})})}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    isExpanded: true,
    title: "資産シミュレーション",
    subInfo: "概要",
    onToggle: () => {}
  },
  render: function Render(args) {
    const [isExpanded, setIsExpanded] = useState(args.isExpanded);
    return <Card {...args} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}>
        <CardBodyHead>
          <p style={{
          margin: 0,
          color: "#666"
        }}>合計: ¥1,000,000</p>
        </CardBodyHead>
        <CardBodyMain>
          <p style={{
          margin: 0
        }}>ここにフォームなどのコンテンツが入ります。</p>
        </CardBodyMain>
      </Card>;
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    isExpanded: false,
    title: "投資設定",
    subInfo: "3件",
    onToggle: () => {}
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    isExpanded: true,
    title: "スクロール表示",
    subInfo: "",
    maxHeight: 200,
    onToggle: () => {}
  },
  render: function Render(args) {
    const [isExpanded, setIsExpanded] = useState(true);
    return <Card {...args} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}>
        <CardBodyMain>
          {Array.from({
          length: 10
        }, (_, i) => <p key={i} style={{
          margin: "8px 0"
        }}>
              コンテンツ行 {i + 1}
            </p>)}
        </CardBodyMain>
      </Card>;
  }
}`,...h.parameters?.docs?.source}}},g=[`Default`,`Collapsed`,`WithMaxHeight`]}))();export{m as Collapsed,p as Default,h as WithMaxHeight,g as __namedExportsOrder,f as default};