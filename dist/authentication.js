"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var moment_1 = __importDefault(require("moment"));
var tsoa_1 = require("tsoa");
var authentication_1 = require("./common/authentication");
var token_1 = require("./infrastructure/token");
/**
 * Wrapper around TSOA Security decorator to give us type safety
 *
 * @export
 * @param {SecurityType} securityType
 * @param {Scope[]} [scopes=DEFAULT_SCOPES]
 * @returns
 */
function Security(securityType, scopes) {
    if (scopes === void 0) { scopes = authentication_1.DEFAULT_SCOPES; }
    return tsoa_1.Security(securityType, scopes);
}
exports.Security = Security;
/**
 * Sets the Token Cookie
 *
 * @export
 * @param {Request} request
 * @param {string} token
 */
function setTokenCookie(request, token) {
    request.ctx.cookies.set(authentication_1.TOKEN_COOKIE_NAME, token, {
        // signed: true,
        // secure: true,
        overwrite: true,
        httpOnly: false,
        maxAge: 30 * 60 * 1000
    });
}
exports.setTokenCookie = setTokenCookie;
/**
 * Gets the Token string from the Cookie
 *
 * @export
 * @param {Request} request
 * @returns {string}
 */
function getTokenCookie(request) {
    return request.ctx.cookies.get(authentication_1.TOKEN_COOKIE_NAME);
}
exports.getTokenCookie = getTokenCookie;
function deleteTokenCookie(request) {
    request.ctx.cookies.set(authentication_1.TOKEN_COOKIE_NAME, getTokenCookie(request), {
        overwrite: true,
        httpOnly: false,
        expires: moment_1.default().subtract(1, 'hour').toDate()
    });
}
exports.deleteTokenCookie = deleteTokenCookie;
/**
 * Parses a TokenPayload from siteminder headers if they are present
 * @param {Request} request
 * @returns {TokenPayload}
 */
function getTokenPayloadFromHeaders(request) {
    var _a = request.headers, headers = _a === void 0 ? {} : _a;
    return {
        guid: headers[authentication_1.SITEMINDER_HEADER_USERGUID],
        displayName: headers[authentication_1.SITEMINDER_HEADER_USERDISPLAYNAME],
        userId: headers[authentication_1.SITEMINDER_HEADER_USERIDENTIFIER],
        type: headers[authentication_1.SITEMINDER_HEADER_USERTYPE]
    };
}
/**
 * Parses a basic auth token from request headers if they are present
 * @param {Request} request
 * @returns {TokenPayload}
 */
function getBasicAuthPayloadFromHeaders(request) {
    var response = { username: "", password: "" };
    var _a = request.headers, headers = _a === void 0 ? {} : _a;
    if (headers.authorization) {
        var base64Credentials = headers.authorization.split(' ')[1];
        var credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        var _b = __read(credentials.split(':'), 2), username = _b[0], password = _b[1];
        response.password = password;
        response.username = username;
    }
    return response;
}
/**
 * The authentication middleware used by TSOA
 * see https://github.com/lukeautry/tsoa#authentication
 *
 * @export
 * @param {Request} request
 * @param {string} securityName
 * @param {string[]} [securityScopes=DEFAULT_SCOPES]
 * @returns {Promise<any>}
 */
function koaAuthentication(request, securityName, securityScopes) {
    if (securityScopes === void 0) { securityScopes = authentication_1.DEFAULT_SCOPES; }
    return __awaiter(this, void 0, void 0, function () {
        var securityType, scopes, _a, siteminderHeaders, token, payload, basicAuthHeaders;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    securityType = securityName;
                    scopes = securityScopes;
                    _a = securityType;
                    switch (_a) {
                        case 'siteminder': return [3 /*break*/, 1];
                        case 'jwt': return [3 /*break*/, 2];
                        case 'basic': return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 5];
                case 1:
                    siteminderHeaders = getTokenPayloadFromHeaders(request);
                    if (siteminderHeaders && siteminderHeaders.guid) {
                        return [2 /*return*/, siteminderHeaders];
                    }
                    else {
                        throw authentication_1.AUTH_ERROR;
                    }
                    _b.label = 2;
                case 2:
                    token = request.ctx.cookies.get(authentication_1.TOKEN_COOKIE_NAME);
                    return [4 /*yield*/, token_1.verifyToken(token)];
                case 3:
                    payload = _b.sent();
                    authentication_1.assertAllScopes(payload, scopes);
                    return [2 /*return*/, payload];
                case 4:
                    basicAuthHeaders = getBasicAuthPayloadFromHeaders(request);
                    if (basicAuthHeaders && basicAuthHeaders.password == process.env.API_PASSWORD && basicAuthHeaders.username == process.env.API_USERNAME) {
                        return [2 /*return*/, basicAuthHeaders];
                    }
                    else {
                        throw authentication_1.AUTH_ERROR;
                    }
                    return [3 /*break*/, 5];
                case 5: throw new Error('Unknown Security Type');
            }
        });
    });
}
exports.koaAuthentication = koaAuthentication;
//# sourceMappingURL=../src/dist/authentication.js.map