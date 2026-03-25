import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "/utils/supabase/client";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export function DatabaseTest() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: any[] = [];

    // Test 1: Check Supabase connection
    testResults.push({
      name: "Supabase Client Initialized",
      status: supabase ? "pass" : "fail",
      message: supabase ? "Supabase client is initialized" : "Supabase client not found",
    });

    // Test 2: Check if we can query tables
    try {
      const { data, error } = await supabase.from("bookings").select("count");
      
      if (error) {
        testResults.push({
          name: "Database Connection",
          status: "fail",
          message: `Error: ${error.message}`,
          details: error,
        });
      } else {
        testResults.push({
          name: "Database Connection",
          status: "pass",
          message: "Successfully connected to database",
        });
      }
    } catch (err: any) {
      testResults.push({
        name: "Database Connection",
        status: "fail",
        message: `Exception: ${err.message}`,
        details: err,
      });
    }

    // Test 3: List all tables
    try {
      const { data, error } = await supabase.rpc("get_tables");
      
      if (error) {
        // Try alternative method
        const { data: schemaData, error: schemaError } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public");

        if (schemaError) {
          testResults.push({
            name: "List Tables",
            status: "fail",
            message: `Cannot list tables: ${schemaError.message}`,
          });
        } else {
          testResults.push({
            name: "List Tables",
            status: "pass",
            message: `Found ${schemaData?.length || 0} tables`,
            details: schemaData,
          });
        }
      }
    } catch (err: any) {
      testResults.push({
        name: "List Tables",
        status: "warning",
        message: "Could not list tables - this is OK",
      });
    }

    // Test 4: Try to insert a test booking
    try {
      const testBooking = {
        service_type: "dental",
        practitioner_type: "general-dentist",
        date: new Date().toISOString(),
        time: "10:00",
        reason: "TEST BOOKING - Please ignore",
        first_name: "Test",
        last_name: "Patient",
        email: "test@example.com",
        phone: "+27000000000",
        id_number: "0000000000000",
        medical_aid: "None",
        medical_aid_number: "",
        status: "pending",
        source: "diagnostic-test",
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert([testBooking])
        .select();

      if (error) {
        testResults.push({
          name: "Insert Test Booking",
          status: "fail",
          message: `Cannot insert: ${error.message}`,
          details: error,
        });
      } else {
        testResults.push({
          name: "Insert Test Booking",
          status: "pass",
          message: "Successfully inserted test booking",
          details: data,
        });

        // Clean up - delete the test booking
        if (data && data[0]) {
          await supabase.from("bookings").delete().eq("id", data[0].id);
        }
      }
    } catch (err: any) {
      testResults.push({
        name: "Insert Test Booking",
        status: "fail",
        message: `Exception: ${err.message}`,
        details: err,
      });
    }

    // Test 5: Check for existing bookings
    try {
      const { data, error, count } = await supabase
        .from("bookings")
        .select("*", { count: "exact" });

      if (error) {
        testResults.push({
          name: "Count Existing Bookings",
          status: "fail",
          message: `Cannot count: ${error.message}`,
        });
      } else {
        testResults.push({
          name: "Count Existing Bookings",
          status: "pass",
          message: `Found ${count || 0} bookings in database`,
          details: data,
        });
      }
    } catch (err: any) {
      testResults.push({
        name: "Count Existing Bookings",
        status: "fail",
        message: `Exception: ${err.message}`,
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-green-50 border-green-200";
      case "fail":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">DentX Quarters - Database Diagnostic Tool</CardTitle>
            <p className="text-gray-600 mt-2">
              This tool will test your database connection and help identify any issues.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button
                onClick={runTests}
                disabled={testing}
                className="bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run Database Tests"
                )}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Test Results:</h3>
                
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {result.name}
                        </h4>
                        <p className="text-sm text-gray-700">{result.message}</p>
                        
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                              Show Details
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Summary:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>✅ Passed: {results.filter(r => r.status === "pass").length}</p>
                    <p>❌ Failed: {results.filter(r => r.status === "fail").length}</p>
                    <p>⚠️ Warnings: {results.filter(r => r.status === "warning").length}</p>
                  </div>

                  {results.filter(r => r.status === "fail").length > 0 && (
                    <div className="mt-4 p-3 bg-red-100 rounded">
                      <p className="font-semibold text-red-900 mb-2">Action Required:</p>
                      <p className="text-sm text-red-800">
                        Some tests failed. The most common issue is that database tables haven't been created yet.
                      </p>
                      <p className="text-sm text-red-800 mt-2">
                        <strong>Solution:</strong> Go to Supabase SQL Editor and run the script from COPY-THIS-SQL.txt
                      </p>
                      <a
                        href="https://supabase.com/dashboard/project/gldxgqcrdwcgjsbyeyma/sql"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Open Supabase SQL Editor
                      </a>
                    </div>
                  )}

                  {results.filter(r => r.status === "fail").length === 0 && results.length > 0 && (
                    <div className="mt-4 p-3 bg-green-100 rounded">
                      <p className="font-semibold text-green-900 mb-2">✅ All Tests Passed!</p>
                      <p className="text-sm text-green-800">
                        Your database is properly configured. Bookings should save successfully.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Click "Run Database Tests" to check your database configuration.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use This Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Run the Tests</h4>
              <p className="text-gray-600">
                Click the "Run Database Tests" button above. This will check your database connection and table setup.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Review the Results</h4>
              <p className="text-gray-600">
                Each test will show as passed (✅), failed (❌), or warning (⚠️).
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Fix Any Issues</h4>
              <p className="text-gray-600">
                If tests fail, the error messages will tell you exactly what's wrong. Most commonly, you need to run the SQL script to create the database tables.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Common Issues</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>"relation 'bookings' does not exist"</strong> - Run the SQL script from COPY-THIS-SQL.txt</li>
                <li><strong>"permission denied"</strong> - Check your Supabase project permissions</li>
                <li><strong>"Cannot insert"</strong> - Check RLS policies in Supabase</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
