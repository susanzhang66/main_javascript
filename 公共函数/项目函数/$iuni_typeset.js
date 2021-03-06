/*
社区排版 删除函数废弃函数编辑函数移动目录
函数名称：$iuni_typeset
函数描述： 
iuni文字排版程序，将文章内容按照指定的高宽进行排版并返回输出。超出版式的内容也会在回调中返回，可以继续翻页显示处理

参数：
codeArr $iuni_parseBBcode函数解析得到的bbcode数组
opt 排版选项，选项包括如下内容
 * width:容器高度
 * height:容器宽度
 * lineHeight:文字行高
 * fontStyle:文字的样式，用于计算文字宽度
 * chaCache:文字宽度缓存对象，同一文字样式下请使用同一文字宽度缓存对象，这样可以提高文字宽度计算效率
 * lazyLoadImgAttr:延时加载图片属性，如果开启，图片节点没有src属性，只有lazyLoadImgAttr属性
 * callback:完成排版后的回调(html，剩余内容，当前高度)
 * enableText:是否启用text代码内容输出
 * enableBBcode:是否启用bbcode代码内容输出
 * enableBBcodeImg:是否启用bbcode-img代码内容输出
 * enableBBCodeUrl:是否启用bbcode-url代码内容输出
 * enableBBCodeXXX:是否启用bbcode-xxx代码内容输出(自定义bbcode时使用，enableBBCodeXXX使用驼峰写法)
 * customBBcodeHtml:自定义bbcode解析器，内容格式为{codeTag:function}，具体写法参考代码注释

回调内容：
text 已经排好版面的html代码
remain 版面排不下的内容，可新建版本继续用$iuni_typeset处理，如已排完，返回空
height 排好版面的高度
*/
/**
 * iuni文字排版程序
 * @param {Object} codeArr 排版的bbcode数组
 * @param {Object} opt 排版选项，选项内容如下
 * width:容器高度
 * height:容器宽度
 * lineHeight:文字行高
 * fontStyle:文字的样式，用于计算文字宽度
 * chaCache:文字宽度缓存对象，同一文字样式下请使用同一文字宽度缓存对象，这样可以提高文字宽度计算效率
 * lazyLoadImgAttr:延时加载图片属性，如果开启，图片节点没有src属性，只有lazyLoadImgAttr属性
 * callback:完成排版后的回调
 * enableText:是否启用text代码内容输出
 * enableBbcode:是否启用bbcode代码内容输出
 * enableBbcodeImg:是否启用bbcode-img代码内容输出
 * enableBbcodeUrl:是否启用bbcode-url代码内容输出
 * enableBbcodeXXX:是否启用bbcode-xxx代码内容输出(自定义bbcode时使用，enableBbcodeXXX使用驼峰写法)
 * 
 * customBBcodeHtml:自定义bbcode解析器，内容格式为codeTag:function()
 * 解析器函数参数说明如下：
 * height 容器高度
 * width 容器宽度
 * curHeight 当前位置高度
 * curWidth 当前位置宽度
 * lineHeight 行高
 * code bbcode
 * callback 回调，
 * 回调内容为(返回生成的html代码，完成后的当前光标高度，当前光标宽度，当前页放不下截断后剩余的code)
 */
function $iuni_typeset(codeArr,opt){
	opt=$extend({
		width:400,//宽
		height:200,//高
		lineHeight:20,//行高
		fontStyle:{},//文字样式
		domTag:'div',//文字宽度计算使用节点
		chaCache:{},//文字宽度缓存
		lazyLoadImgAttr:false,//延迟加载图片属性
		callback:null,//完成回调
		enableText:true,//是否启用text节点内容输出
		enableBbcode:true,//是否启用bbcode节点内容输出
		enableBbcodeImg:true,//是否启用bbcode-img节点内容输出
		enableBbcodeUrl:false,//是否启用bbcode-url节点内容输出
		imgCheck:false,//图片检查,如果要检查，设置函数bool function(url)
		urlCheck:false,//链接检查,如果要检查，设置函数bool function(url)
		customBBcodeHtml:{}//自定义bbcode解析
	},opt);
	
	//初始化内容
	var htmls=[],remains=null;
	var width=opt.width,//宽度
	height=opt.height,//高度
	lineHeight=opt.lineHeight,//行高
	curHeight=0,//当前y
	curWidth=0,//当前x
	domTag=opt.domTag,//文字宽度计算用的标签
	fontStyle=opt.fontStyle,//文字样式
	chaCache=opt.chaCache,//文字缓存
	customBBcodeHtml=opt.customBBcodeHtml||{};//自定义bbcode解析
	//默认解析器
	var codeHtml={
		//文本字段解析
		text:function(height,width,curHeight,curWidth,lineHeight,code,callback){
			var charArr=$isArray(code.data)?code.data:$getCharArray(code.data);//文字数组
			if(!charArr||!charArr.length){
				//无内容
				callback('',curHeight,curWidth);
				return;
			}
			//获取宽度
			$getCharWidth(charArr,{
				fontStyles:fontStyle,
				domTag:domTag,
				chaWidth:chaCache,
				callback:function(chaWidth){
					var htmls=[],cw;
					//处理字符串转义字符
					var escCode,end=false;
					//遍历需要计算宽度的字符
					for(var i=0,len=charArr.length;i<len;i++){
						var x=charArr[i];
						if(curHeight+lineHeight>height){
							//已不足一行,返回
							callback(htmls.join(''),curHeight,curWidth,{type:'text',data:charArr.slice(i)});
							return;
						}
						if(x=='\n'){
							//换行
							htmls.push(x);
							curHeight+=lineHeight;
							curWidth=0;
							continue;
						}
						cw=chaWidth[x];
						if(cw){
							if((curWidth+=cw)>width){//换行
								curHeight+=lineHeight;
								curWidth=0;
								i--;
								continue;
							}
							htmls.push(x);
						}
					}
					//回调
					callback(htmls.join(''),curHeight,curWidth);
				}
			});
		},
		//bbcode解析
		bbcode:function(height,width,curHeight,curWidth,lineHeight,code,callback){
			var data=code.data,type=data.type,dealFunc=customBBcodeHtml[type]||bbcodeHtml[type];
			//检查是否支持
			if(dealFunc&&opt['enableBbcode'+$ucfirst(type)]){
				dealFunc(height,width,curHeight,curWidth,lineHeight,data,function(html,curHeight,curWidth,remainCode){
					callback(html,curHeight,curWidth,remainCode?{type:'bbcode',data:remainCode}:null);
				});
			}else{
				callback('',curHeight,curWidth,null);
			}
		}
	};
	//内置bbcode解析器
	var bbcodeHtml={
		img:function(height,width,curHeight,curWidth,lineHeight,code,callback){
			var data=code,sizes=data.sizes,urls=data.urls;
			//获得合适的尺寸图片
			var size,url,of=Number.MAX_VALUE,dataset=[];
			$each(sizes,function(s,i){
				if(Math.abs(s[0]-width)<=of){
					of=Math.abs(s[0]-width);
					size=s;
					url=urls[i];
				};
				dataset.push(s[0]+','+s[1]+','+url);
			});
			if(opt.imgCheck&&!opt.imgCheck(url)){
				//检查通过失败
				callback('',curHeight,curWidth);
				return;
			}
			//布局换行产生的高度
			var addHeight=curWidth==0?0:lineHeight;
			//处理高度
			var ih=Math.round(size[1]*width/size[0]);
			if(ih+curHeight+addHeight>height){
				//位置不够,回调
				callback('',curHeight,curWidth,code);
			}else{
				curHeight+=ih+addHeight;
				curWidth=0;
				var html=$parseStr('<img style="display:block;width:{#width#}px;height:{#height#}px" {#srcAttrName#}="{#src#}" data-set="{#dataset#}"/>',{
					src:url,
					srcAttrName:opt.lazyLoadImgAttr?opt.lazyLoadImgAttr:'src',
					width:width,
					height:ih,
					dataset:dataset.join('#')
				});
				callback(html,curHeight,curWidth);
			}
		},
		url:function(height,width,curHeight,curWidth,lineHeight,code,callback){
			var data=code,href=data.href,urlText=data.text;
			if(opt.urlCheck&&!opt.urlCheck(href)){
				//检查通过失败
				callback('',curHeight,curWidth);
				return;
			}
			var htmls=['<a target="blank" href="',href,'">'];
			var charArr=$isArray(urlText)?urlText:$getCharArray(urlText);//文字数组
			if(!charArr||!charArr.length){
				//无内容
				callback('',curHeight,curWidth);
				return;
			}
			//获取宽度
			$getCharWidth(charArr,{
				fontStyles:fontStyle,
				domTag:domTag,
				chaWidth:chaCache,
				callback:function(chaWidth){
					var cw;
					//处理字符串转义字符
					var escCode,end=false;
					//遍历需要计算宽度的字符
					for(var i=0,len=charArr.length;i<len;i++){
						var x=charArr[i];
						if(curHeight+lineHeight>height){
							//已不足一行,返回
							htmls.push('</a>');
							callback(htmls.join(''),curHeight,curWidth,{type:'url',data:{href:href,urlText:charArr.slice(i)}});
							return;
						}
						if(x=='\n'){
							//换行
							htmls.push(x);
							curHeight+=lineHeight;
							curWidth=0;
							continue;
						}
						cw=chaWidth[x];
						if(cw){
							if((curWidth+=cw)>width){//换行
								curHeight+=lineHeight;
								curWidth=0;
								i--;
								continue;
							}
							htmls.push(x);
						}
					}
					htmls.push('</a>');
					//回调
					callback(htmls.join(''),curHeight,curWidth);
				}
			});
		}
	};
	
	//开始遍历解析
	$asyncEachSeries(codeArr,function(code,callback){
		//剩余
		if(remains){
			remains.push(code);
			return callback();
		}
		//空节点
		if(!code){
			return callback();
		}
		var type=code.type;
		//检查支持
		if(codeHtml[type]&&opt['enable'+$ucfirst(type)]){
			codeHtml[type](height,width,curHeight,curWidth,lineHeight,code,function(html,cHeight,cWidth,remainCode){
				htmls.push(html);
				remainCode&&(remains=[remainCode]);
				curHeight=cHeight;
				curWidth=cWidth;
				callback();
			});
		}else{
			return callback();
		}
	},function(){
		//解析完成，回调html，剩余内容，当前高度
		opt.callback&&opt.callback(htmls.join(''),remains,curHeight);
	});
}
调用示例： 
/**
 * 解析文章内容，返回对应的bbcode数组，给到$iuni_typeset函数做排版输出
 */
var bbcodes=$iuni_parseBBcode('这是一段测试图片：[img=80*60;120*90;480*360]http://static.iuniimg.com/pics/80_60/test.jpg;http://static.iuniimg.com/pics/120_90/test.jpg;http://static.iuniimg.com/pics/480*360/test.jpg[/img]\n这是一个测试链接：[url=http://www.baidu.com]去搜索[/url]');
//排版
$iuni_typeset(bbcodes,{
		fontStyles : {
			fontFamily : 'arial,\u5FAE\u8F6F\u96C5\u9ED1',
			fontSize : "12px",
			lineHeight : '1.5',
			fontStyle : 'normal',
			fontVariant : 'normal',
			fontWeight : 'normal'
		},
		lineHeight:20,
		width:400,
		maxHeight:500,
		domTag:'pre',
		enableLink:true,
		callback:function(text,remain,height){
			//输出
			dom.innerHTML=text;
			
		}
	}
依赖函数： 
$asyncEachSeries$limitCalls$parseStr$each$break$ucfirst$getCharWidth$extend$each$isArray$isEscapeSequense$isAllowedUnicode$each$getCharArray$isAllowedUnicode$keys$each$map$setStyles$whilst$getCharArray$isArray$extend