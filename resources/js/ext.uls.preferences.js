/**
 * ULS preferences system for MediaWiki.
 * Cookies for anonymous users, preferences for logged in users.
 *
 * Copyright (C) 2012 Alolita Sharma, Amir Aharoni, Arun Ganesh, Brandon Harris,
 * Niklas Laxström, Pau Giner, Santhosh Thottingal, Siebrand Mazeland and other
 * contributors. See CREDITS for a list.
 *
 * UniversalLanguageSelector is dual licensed GPLv2 or later and MIT. You don't
 * have to do anything special to choose one license or the other and you don't
 * have to notify anyone which license you are using. You are free to use
 * UniversalLanguageSelector in commercial projects as long as the copyright
 * header is left intact. See files GPL-LICENSE and MIT-LICENSE for details.
 *
 * @file
 * @ingroup Extensions
 * @licence GNU General Public Licence 2.0 or later
 * @licence MIT License
 */

( function( $, mw ) {
	"use strict";

	var ULSPreferences = function ( group ) {
		this.cookieName = this.preferenceName = 'uls-preferences';
		this.username = mw.user.getName();
		this.isAnon = mw.user.isAnon();
		this.preferences = null;
		this.group = group;
		this.init();
	};

	ULSPreferences.prototype = {
		/**
		 * Initialize
		 */
		init: function () {
			if ( this.isAnon ) {
				this.cookie = $.cookie( this.cookieName );
				this.preferences = $.parseJSON( this.cookie );
			} else {
				var options = mw.user.options.get( this.preferenceName );
				this.preferences = $.parseJSON( options );
			}
			this.preferences = this.preferences || {};
		},

		/**
		 * Set the preference
		 * @param {String} key
		 * @param value
		 */
		set: function ( key, value ) {
			if ( !this.preferences[this.group] ) {
				this.preferences[this.group] = {};
			}
			this.preferences[this.group][key] = value;
		},

		/**
		 * Get a preference value for the given preference name
		 * @param key
		 * @returns
		 */
		get: function ( key ) {
			return this.preferences[this.group] && this.preferences[this.group][key];
		},

		/**
		 * Save the preferences
		 *
		 * @param callback
		 */
		save: function ( callback ) {
			var that = this;
			callback = callback || $.noop();
			if ( this.isAnon ) {
				// Anonymous user- Save preferences in cookie
				$.cookie( this.cookieName, $.toJSON( this.preferences ), {
					expires: 30,
					HttpOnly: true,
					path: '/'
				} );
				callback.call( this, true );
			} else {
				// Logged in user. Use MW apis to change preferences
				var api = new mw.Api();
				api.post( {
					action: 'tokens',
					type: 'options'
				} ).done( function ( tokenresult ) {
					var token = tokenresult.tokens.optionstoken;
					api.post( {
						action: 'options',
						change: 'hideminor=1',
						optionname: that.preferenceName,
						optionvalue: $.toJSON( that.preferences ),
						token: token
					} ).done( function ( result ) {
						callback.call( this, true );
					} ).fail( function () {
						callback.call( this, false );
					} );
				} ).fail( function ( xhr, textStatus, exception ) {
					callback.call( this, false );
				} );
			}
		}
	};

	mw.uls = mw.uls || {};
	mw.uls.preferences = function( option ) {
		var data = $( 'body' ).data( "preferences" ),
			options = typeof option === "object" && option;

		if ( !data ) {
			$( 'body' ).data( "preferences", ( data = new ULSPreferences( options ) ) );
		}
		if ( typeof option === "string" ) {
			data.get( option );
		}
		return data;
	};

}( jQuery, mediaWiki ) );