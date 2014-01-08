(function ($) {
   $.fn.jQCOP = function() {
   		"use strict";
	
		
		/*  returns the class object of Given String or class function
		 *
		 *  null - if not a valid class
		*/
		function _getClass(className) {
			var classObject = null;
			if (typeof className == "string") {
				try { // try to create function object 
					classObject = eval(className);
				}
				catch (e) {
					 
				}
			} else if (typeof className === "function") {
				classObject = className;
			}
			return classObject;
		}
		
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
			/*  returns the class function
			 *	@fullClassName - class name with optional namespace, like "Car" or "com.auto.classes.Car"
			 *  @parents  - List of parent classes, can be null, can be string or function
			 *  @dcls    - Class defination [javascript object] or function
		     *  @singleton (default false) - if true, Class can't be istanciated and will return an object instead
			 *  @scope (default $.fn.jQCOP.site) - define the class in given namespace, give window for global scope 
		    */
			"cls" : function (fullClassName, parents, dcls, singleton, scope) {
				
				// ----Private properties-------------
				var className = null, classNameData, i = 0, j = 0, c =0, 
					parentFuncList = [], item, implCode = null ,
					mixin = {},
					realparentFunc = function() {},
					_constructor = function(){},
					child = {},
					parentConstructor = null, pobj = null,
					parentClass	,
					parentObj, objItem;

				if (fullClassName) {
					classNameData = _getClassFromNS(fullClassName); 
					className = classNameData.className;
				}

				if (!singleton) {
					singleton = false;
				}

				if (!scope) {
					scope =  $.fn.jQCOP.site;
				}

				if (!console || !console.log) {  // for IE 7 and less
					var console = {};
					console.log = function() {

					}
				}
				
				//-----------Private methods ---------

				function _checkDirectCall  () {
					// singleton is coming from parent Scope
					if (singleton) {
						if (this !== window) {
							throw new Error("Constructor function: Please call without using new keyword.");
						}
					}
					else {
						if (this === window) {
							throw new Error("Constructor function: Please call using new keyword.");
						}
					}
				}

				// create a empty new function
				var f = function  (){ 
						_checkDirectCall.apply(this, arguments);
						_constructor.apply(this, arguments); 
				};
				

				function _displayMyName(nameObj) {
					var myName = null;
				   	if (nameObj && nameObj.toString) {
				   		myName = nameObj.toString();
				   	}
				   	myName = myName.substr('function '.length);
				   	myName = myName.substr(0, myName.indexOf('('));

				   	return myName; 
				}


				function _findFuncName(calleeFunc, that) {
					
					var funcName = "", i, item, currentNode = that, c = 0;
					// loop through _parent chain to find callee function
					while (currentNode._parent && currentNode._parent != Object.prototype) {
						for (i in currentNode  ) {
							item = currentNode[i];
							if (typeof item == "function" && calleeFunc === item ) {
								funcName = i;
								break; // for loop
							}
						}
						if (funcName) {
							break; // while loop
						}
						else {
							// set currentNode to parent
							currentNode = currentNode._parent.prototype;
						}
					}
					return {"name" : funcName, "scope":currentNode};
				}

				// this function finds the callee function from the scope chanin and calls it 
				
				function _inherited (args) {
					var calleeFunc, calleeFuncInfo, that, found = false, startNode, q; 
					if (!args) {
						args = arguments;
					}
					calleeFunc = args.callee; 
					// 
					that = this; 
					// get name and position of callee function in class scope chain
					calleeFuncInfo = _findFuncName(calleeFunc, that);

					if (!calleeFuncInfo) { // No callee info, give up, log error
						console.log("Error: unable to find this method is parent class " + calleeFunc ) ;
						return false;
					}
					// convert arguments into proper array 
					q = Array.prototype.slice.call(args);
					// start from the parent of callee 
					startNode = calleeFuncInfo.scope._parent; 

					while (startNode && startNode != Object) { // keep looking in the scope chain, unless either you find it or reached native Object class 
						if (startNode.prototype[calleeFuncInfo.name]) {
							// found it, call it in current object's scope
					 		startNode.prototype[calleeFuncInfo.name].apply(this, q); 
					 		found = true;
					 		break;
					 	}
					}
					
					if (!found) {
							console.log("Error: unable to find this method is parent class " + calleeFuncInfo.name ) ;
					}
					
				}
				
				//----------- end Private methods -----------

				// If parent class/classes provided
				if (parents) {
					// check if it is not a list 
					if (!jQuery.isArray(parents)) {
						parents = [parents];
					}

					// start looking from the end of list
					for (i =  parents.length -1; i>= 0; i-- ) {
						item = parents[i];
						if (item == null || item === "") {
							// empty or null string 
							continue;
						}
						parentClass =  _getClass(item);
						if (i == 0 ) {
							// First class should be used for inheritence, rest are mixins
							realparentFunc = parentClass;
						}
						else {
							if (typeof parentClass == "function") {
								parentObj = new parentClass();
								for (j in parentObj ) {
									objItem = parentObj[j]; 
									if (objItem !== "constructor" ) { // add item either it's not constructor 
										mixin[j] = objItem; 
									}
							
								} // end for 
							} // end if
						}  // end else
					}  // end for parents loop
				}  // end if

				
				// create empty constructor function
				if (dcls) {
					if (typeof dcls == "object") {
						child = dcls;
					}
					if (typeof dcls == "function") {
						child = new dcls;
					}
				}

				if (child && child["constructor"] && child.hasOwnProperty("constructor")) {
					// constructor function found in 
					_constructor =  child["constructor"]; 
				}
				else {
					var o = null;
					if (realparentFunc && realparentFunc["constructor"] && realparentFunc.hasOwnProperty("constructor") ) {  // use parent constructor 
						_constructor = realparentFunc["constructor"];
					}
				}
				

				
				
				// Set the newly created function's prototype to Parent's prototype
				f.prototype = new realparentFunc();
				
                // add properties from parent classes
				for (j in mixin ) {
					objItem = mixin[j]; 
					if ( mixin.hasOwnProperty(j) ) {
						f.prototype[j] = objItem; 
					}
				}				

				// add properties from class defination
				for ( j in child ) {
					objItem = child[j]; 
					if ( child.hasOwnProperty(j) ) {
						f.prototype[j] = objItem; 
					}
							
				}

				// constructor was overwritten by parent, so set it back to new class
				f.constructor = f;
				// add parent to this class for calling super functions from child classes
				f.prototype._parent = realparentFunc;
				
				f.prototype.inherited = _inherited;

				// function is ready, place it in right scope or return it
				if (className) { // add this function in right namespace 
					 // get fully qualified namespace
					 var fullNS = _getNSObj(classNameData, scope); 
					 // attach this function to namespace
					 fullNS[className] = f;
					 return true;
				} else { // anonymous function, just return the function  
					if (!singleton) {
						return f;
					}
					else {
						singleton = false;
						var o = new f();
						singleton = true;
						return o;
					}
				}
				
				
		}, 
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
		}, 

		"site":{},
		"ns" : [],
		"basePath":"apps"
	};

}();

}(jQuery));