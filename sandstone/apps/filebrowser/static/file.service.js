'use strict';
/**
 * Filebrowser
 * @namespace Filebrowser
 */
angular.module('sandstone.filebrowser')
/**
 * @namespace FileService
 * @desc Service to hold information like current directory, volume information, root directories
 * @memberOf Filebrowser
 */
.factory('FileService', ['$rootScope', function($rootScope){
  var fileData;
  var currentDirectory = [];
  var root_dir = [];
  var volume_info;
  var selection = "";

  /**
 * @name setFileData
 * @desc Setter for fileData
 * @param {Object} data The object containing the File Data
 * @memberOf FileBrowser.FileService
 */
  var setFileData = function(data) {
    fileData = data;
  };

  /**
 * @name getFileData
 * @desc Getter for fileData
 * @returns {Object} fileData The object representing the File Data
 * @memberOf FileBrowser.FileService
 */
  var getFileData = function(){
    return fileData;
  };

  /**
 * @name getCurrentDirectory
 * @desc Getter for currentDirectory
 * @returns {Object} currentDirectory The object representing the current directory
 * @memberOf FileBrowser.FileService
 */
  var getCurrentDirectory = function() {
    return currentDirectory;
  };

  /**
 * @name getVolumeInfo
 * @desc Getter for volume_info
 * @returns {Object} volume_info The object representing the volume info
 * @memberOf FileBrowser.FileService
 */
  var getVolumeInfo = function() {
    return volume_info;
  };

  /**
 * @name setCurrentDirectory
 * @desc Setter for currentDirectory
 * @param {String} filepath The filepath for the current directory
 * @memberOf FileBrowser.FileService
 */
  var setCurrentDirectory = function(filepath) {
    currentDirectory = filepath.split("/")
    // Current Directory Path should be '/'
    currentDirectory[0] = "/";
    // If last character is blank, splice it out
    if(currentDirectory[currentDirectory.length - 1] == "") {
      currentDirectory.splice(-1);
    }
  };

  /**
 * @name setRootDirectory
 * @desc Setter for rootDirectory
 * @param {String} rootDirectory The filepath for the root directory
 * @memberOf FileBrowser.FileService
 */
  var setRootDirectory = function(rootDirectory) {
    root_dir = rootDirectory.split("/")
    // Current Directory Path should be '/'
    root_dir[0] = "/";
    // If last component is blank, splice it out
    if(root_dir[root_dir.length - 1] == "") {
      root_dir.splice(-1);
    }
  };

  /**
 * @name setVolumeInfo
 * @desc Setter for volumeInfo
 * @param {Object} volumeInfo The object representing the volume information
 * @memberOf FileBrowser.FileService
 */
  var setVolumeInfo = function(volumeInfo) {
    volume_info = volumeInfo;
  };

  /**
 * @name setVolumeInfo
 * @desc Getter for root_dir
 * @returns {Object} root_dir The object representing the root directory
 * @memberOf FileBrowser.FileService
 */
  var getRootDirectory = function() {
    return root_dir;
  };

  /**
 * @name setVolumeInfo
 * @desc Setter for selected file
 * @param {Object} path The object representing the selection path
 * @memberOf FileBrowser.FileService
 */
  var setSelectionPath = function(path) {
    selection = path;
  };

  /**
 * @name getSelectionPath
 * @desc Getter for selected file
 * @returns {Object} selection The object representing the selection path
 * @memberOf FileBrowser.FileService
 */
  var getSelectionPath = function() {
    return selection;
  };

  return {
    setFileData: setFileData,
    getFileData: getFileData,
    setCurrentDirectory: setCurrentDirectory,
    getCurrentDirectory: getCurrentDirectory,
    setRootDirectory: setRootDirectory,
    getRootDirectory: getRootDirectory,
    setVolumeInfo: setVolumeInfo,
    getVolumeInfo: getVolumeInfo,
    setSelectionPath: setSelectionPath,
    getSelectionPath: getSelectionPath
  };
}]);
