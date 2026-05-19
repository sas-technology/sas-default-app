import XCTest
@testable import SASApp

final class FirstRunSetupTests: XCTestCase {
  func testGenerateAuthSecretReturns32BytesBase64() {
    let secret = FirstRunSetup.generateAuthSecret()
    XCTAssertEqual(secret.count, 44)
  }

  func testGenerateSetupTokenReturns64HexChars() {
    let token = FirstRunSetup.generateSetupToken()
    XCTAssertEqual(token.count, 64)
    XCTAssertTrue(token.allSatisfy { $0.isHexDigit })
  }

  func testParseEnvFileExtractsKeyValuePairs() {
    let content = """
    AUTH_SECRET=abc123
    AUTH_URL=http://localhost:11000
    # comment line
    DATABASE_URL=file:./dev.db
    """
    let parsed = FirstRunSetup.parseEnvFile(content)
    XCTAssertEqual(parsed["AUTH_SECRET"], "abc123")
    XCTAssertEqual(parsed["AUTH_URL"], "http://localhost:11000")
    XCTAssertEqual(parsed["DATABASE_URL"], "file:./dev.db")
    XCTAssertNil(parsed["# comment line"])
  }

  func testParseEnvFileIgnoresBlankLines() {
    let parsed = FirstRunSetup.parseEnvFile("\n\nKEY=value\n\n")
    XCTAssertEqual(parsed["KEY"], "value")
    XCTAssertEqual(parsed.count, 1)
  }
}
