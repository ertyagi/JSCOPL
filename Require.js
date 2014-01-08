(function ($) {
  if (!$.fn.require)  $.fn.require = function() {



		/*  returns the class name and namespace data of Given String 
		 *
		 *  
		*/
		function _getClassFromNS (fullClassName) {
			var nsParts = [], className;
			if ( fullClassName.indexOf(".") >= 0  ) { 
				nsParts = fullClassName.split(".");
				className = nsParts.pop();
			}
			else {
				className = fullClassName;
			}

			return {"className":className, "ns": nsParts};
		}

		/*  returns the namespace object
		 *
		 *  null - if not a valid class
		*/

		function _getNSObj(classNameData, scope) {
			var n = classNameData.ns.length, tempScope = scope;
			
			if (n > 0 ) {
				for (var i = 0; i<n ; i++ ) {
					var item = classNameData.ns[i]; 
					if (!tempScope[item]) {
						tempScope[item] = {};
					}
					tempScope = tempScope[item]; 
				}
			}
			return tempScope; 
		}
return {
"require": function(path) {
			if (!path) {
				return false;
			}
			var classNameData = _getClassFromNS(path); 

			var className = classNameData.className; 
			var nsParts = classNameData.ns;
			 var fullNS = _getNSObj(classNameData, $.fn.jQCOP.site); 

			var cls = null; 
			if (typeof className === "string") {
				/*
				try {
					className = eval(className);
				}
				catch (e) {
					// log it 
				}
				*/
				cls = fullNS[className]; 
			}
			if (!cls || typeof className !== "function" ) {
				var basePath1 = $.fn.jQCOP.basePath, basePath="",  url = "";
				if (nsParts.length > 1 ) {
					basePath = basePath1 + "/" +   nsParts.join("/") + "/"; 
				}
				url = basePath + className + ".js"; 
				// We want to make a synchronous call  
				$.ajaxSetup({async:false});
				$.getScript(url).done(function(script, textStatus) {
				  //console.log( textStatus );
				}).fail(function(jqxhr, settings, exception) {
				 console.log("error");
				});
				// revert back to asynchronous calls 
				$.ajaxSetup({async:true});
			}
		}
	}
}();

}(jQuery));